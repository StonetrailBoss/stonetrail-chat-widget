"""Postgres-backed outbox worker: python -m app.messaging_worker.
Ambiguous sends are never automatically retried; staff must reconcile them.
"""
import asyncio,os,logging
from datetime import timedelta
from sqlalchemy import select,update
from app.database import SessionLocal
from app.models.core import utcnow
from app.models.inbox import Conversation,Message
from app.models.messaging import DeliveryJob,ConversationRoute,ChannelConnection,WebhookEvent
from app.services.messaging_service import aware,apply_receipt
from app.whatsapp_client import send_whatsapp_text,DeliveryError
from app.openai_client import run_hotel_agent
log=logging.getLogger(__name__)

def claim(factory):
    with factory() as db:
        # Crashed worker jobs are quarantined, never blindly replayed.
        stale=db.scalars(select(DeliveryJob).where(DeliveryJob.state=="sending",DeliveryJob.started_at<utcnow()-timedelta(minutes=5)))
        for j in stale:
            j.state="unknown";j.error_code="worker_interrupted"
            if j.purpose!="generate_ai":db.get(Message,j.message_id).delivery_status="unknown"
        db.commit()
        q=select(DeliveryJob).where(DeliveryJob.state=="queued").order_by(DeliveryJob.created_at).with_for_update(skip_locked=True).limit(1)
        j=db.scalar(q)
        if not j:return None
        changed=db.execute(update(DeliveryJob).where(DeliveryJob.id==j.id,DeliveryJob.state=="queued").values(state="sending",started_at=utcnow(),attempts=DeliveryJob.attempts+1)).rowcount
        db.commit();return j.id if changed else None

async def process_one(factory=SessionLocal):
    if os.getenv("WHATSAPP_SEND_ENABLED","false").lower()!="true":return False
    jid=claim(factory)
    if not jid:return False
    with factory() as db:
        j=db.get(DeliveryJob,jid);m=db.get(Message,j.message_id)
        cid=m.conversation_id
        connection=db.scalar(select(ChannelConnection).where(ChannelConnection.id==j.connection_id).with_for_update())
        c=db.scalar(select(Conversation).where(Conversation.id==cid).with_for_update())
        if j.purpose=="generate_ai":
            if c.human_owned or c.status=="closed" or os.getenv("WHATSAPP_AI_ENABLED","false").lower()!="true":j.state="cancelled";db.commit();return True
            text=m.body;db.commit() # Do not hold a lock during model generation.
            try:reply=await asyncio.to_thread(run_hotel_agent,text)
            except Exception:
                j=db.get(DeliveryJob,jid);j.state="failed";j.error_code="ai_generation_failed";db.commit();return True
            c=db.scalar(select(Conversation).where(Conversation.id==cid).with_for_update())
            if c.human_owned or c.status=="closed":j.state="cancelled"
            else:
                out=Message(conversation_id=cid,body=reply[:4096],kind="ai",delivery_status="queued")
                db.add(out);db.flush();db.add(DeliveryJob(message_id=out.id,connection_id=j.connection_id,purpose="ai_reply"));j.state="completed"
            db.commit();return True
        route=db.scalar(select(ConversationRoute).where(ConversationRoute.conversation_id==cid))
        if c.status=="closed" or (j.purpose=="ai_reply" and c.human_owned):
            j.state="cancelled"
        elif not route or route.connection_id!=j.connection_id or connection.phone_number_id!=os.getenv("WHATSAPP_PHONE_NUMBER_ID"):
            j.state="failed";j.error_code="route_configuration_mismatch"
        elif aware(route.last_inbound_at)+timedelta(hours=24)<=utcnow():
            j.state="failed";j.error_code="reply_window_expired"
        else:
            # Serialize send authorization with staff handoff; an already in-flight provider request cannot be recalled.
            try:
                result=await send_whatsapp_text(route.recipient,m.body)
                j.provider_id=result["messages"][0]["id"];j.state="accepted"
                for receipt in db.scalars(select(WebhookEvent).where(WebhookEvent.connection_id==connection.id,WebhookEvent.provider_id==j.provider_id)):
                    apply_receipt(db,connection,receipt)
            except DeliveryError as exc:j.state="unknown" if exc.ambiguous else "failed";j.error_code=exc.code
            except Exception:
                j.state="unknown";j.error_code="unexpected_outcome"
        m.delivery_status=j.state;db.commit()
    return True

async def main():
    logging.basicConfig(level=logging.INFO)
    while True:
        try:worked=await process_one()
        except Exception:
            log.error("Worker iteration failed; inspect database and configuration")
            worked=False
        await asyncio.sleep(0.1 if worked else 2)
if __name__=="__main__":asyncio.run(main())
