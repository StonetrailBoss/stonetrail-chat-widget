"""Transactional inbound ingestion; provider calls run only in the worker."""
import hashlib,os
from datetime import datetime,timezone,timedelta
from sqlalchemy import select
from fastapi import HTTPException
from app.models.core import utcnow
from app.models.inbox import Conversation,Message
from app.models.messaging import ChannelConnection,ConversationRoute,WebhookEvent,DeliveryJob
from app.services.handoff import wants_human_handoff

STATUS_RANK={"accepted":0,"sent":1,"delivered":2,"read":3}
def aware(d):return d.replace(tzinfo=timezone.utc)
def event_time(value):
    try:return datetime.fromtimestamp(int(value),timezone.utc)
    except (TypeError,ValueError,OverflowError,OSError):raise HTTPException(422,"Invalid provider timestamp")
def key(*parts):return hashlib.sha256("|".join(parts).encode()).hexdigest()
def cancel_ai(db,cid):
    jobs=db.scalars(select(DeliveryJob).join(Message,Message.id==DeliveryJob.message_id).where(Message.conversation_id==cid,DeliveryJob.purpose=="ai_reply",DeliveryJob.state=="queued"))
    for j in jobs:
        j.state="cancelled";db.get(Message,j.message_id).delivery_status="cancelled"

def handoff(db,c,reason):
    c.human_owned=True;c.status="open";cancel_ai(db,c.id)
    db.add(Message(conversation_id=c.id,body=reason,kind="system",delivery_status="internal"))

def apply_receipt(db,connection,event):
    j=db.scalar(select(DeliveryJob).where(DeliveryJob.connection_id==connection.id,DeliveryJob.provider_id==event.provider_id).with_for_update())
    if not j:return
    old=j.state;new=event.status
    if new in STATUS_RANK and STATUS_RANK[new]>STATUS_RANK.get(old,-1) and not (old=="failed" and new=="sent"):j.state=new
    elif new=="failed" and old not in ("delivered","read"):j.state="failed";j.error_code="provider_delivery_failed"
    db.get(Message,j.message_id).delivery_status=j.state
    if j.state in ("delivered","read"):connection.delivered_at=utcnow()

def ingest(db,payload):
    if not isinstance(payload,dict):raise HTTPException(422,"Invalid webhook object")
    if payload.get("object")!="whatsapp_business_account":return {"stored":0,"duplicates":0}
    stored=duplicates=0
    for entry in payload.get("entry",[]):
      for change in entry.get("changes",[]):
        if change.get("field")!="messages":continue
        value=change.get("value",{})
        phone=value.get("metadata",{}).get("phone_number_id")
        connection=db.scalar(select(ChannelConnection).where(ChannelConnection.phone_number_id==phone).with_for_update())
        if not connection:continue # No cross-property fallback.
        for incoming in value.get("messages",[]):
            pid=incoming.get("id");sender=incoming.get("from","")
            if not pid or not sender.isdigit() or not 5<=len(sender)<=20:raise HTTPException(422,"Invalid message identity")
            ek=key(connection.id,"inbound",pid)
            if db.get(WebhookEvent,ek):duplicates+=1;continue
            at=event_time(incoming.get("timestamp"))
            if at>utcnow()+timedelta(minutes=5):raise HTTPException(422,"Future provider timestamp")
            route=db.scalar(select(ConversationRoute).where(ConversationRoute.connection_id==connection.id,ConversationRoute.recipient==sender))
            if not route:
                c=Conversation(property_id=connection.property_id,subject="WhatsApp guest inquiry",channel="whatsapp",human_owned=os.getenv("WHATSAPP_AI_ENABLED","false").lower()!="true")
                db.add(c);db.flush()
                route=ConversationRoute(connection_id=connection.id,conversation_id=c.id,recipient=sender,last_inbound_at=at)
                db.add(route)
            c=db.scalar(select(Conversation).where(Conversation.id==route.conversation_id).with_for_update())
            c.status="open"
            if aware(route.last_inbound_at)<at:route.last_inbound_at=at
            kind=incoming.get("type")
            text=incoming.get("text",{}).get("body","") if kind=="text" else f"[Incoming {kind or 'unsupported'} message; attachment retrieval pending]"
            if not text or len(text)>10000:raise HTTPException(422,"Invalid message body")
            m=Message(conversation_id=c.id,body=text,kind="guest",delivery_status="received",created_at=at)
            db.add(m);db.add(WebhookEvent(event_key=ek,connection_id=connection.id,provider_id=pid,status="received",occurred_at=at));db.flush()
            connection.inbound_at=utcnow()
            if kind!="text" or wants_human_handoff(text):
                handoff(db,c,"Human assistance requested. Staff notification is available in this inbox; external alerts are not configured.")
                if kind=="text" and aware(route.last_inbound_at)+timedelta(hours=24)>utcnow():
                    ack=Message(conversation_id=c.id,body="I have requested assistance from our team. They will reply here when available.",kind="handoff_ack",delivery_status="queued")
                    db.add(ack);db.flush()
                    db.add(DeliveryJob(message_id=ack.id,connection_id=connection.id,purpose="handoff_ack"))
            elif not c.human_owned and os.getenv("WHATSAPP_AI_ENABLED","false").lower()=="true":
                # An AI job references the guest message; generation occurs outside the webhook request.
                db.add(DeliveryJob(message_id=m.id,connection_id=connection.id,purpose="generate_ai"))
            stored+=1
        for status in value.get("statuses",[]):
            state=status.get("status");pid=status.get("id")
            if state not in ("sent","delivered","read","failed") or not pid:continue
            at=event_time(status.get("timestamp"));ek=key(connection.id,pid,state,str(status.get("timestamp")))
            if db.get(WebhookEvent,ek):duplicates+=1;continue
            event=WebhookEvent(event_key=ek,connection_id=connection.id,provider_id=pid,status=state,occurred_at=at)
            db.add(event);apply_receipt(db,connection,event);stored+=1
    return {"stored":stored,"duplicates":duplicates}

def queue_reply(db,c,m):
    route=db.scalar(select(ConversationRoute).where(ConversationRoute.conversation_id==c.id))
    if not route:raise HTTPException(409,"No delivery route")
    if aware(route.last_inbound_at)+timedelta(hours=24)<=utcnow():raise HTTPException(409,"WhatsApp reply window expired; an approved template workflow is required")
    if len(m.body)>4096:raise HTTPException(422,"WhatsApp text is limited to 4096 characters")
    m.delivery_status="queued";db.flush()
    job=DeliveryJob(message_id=m.id,connection_id=route.connection_id,purpose="staff_reply")
    db.add(job)
    return job
