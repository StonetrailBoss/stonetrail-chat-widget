import asyncio
from fastapi import APIRouter,Depends,Request,Response,HTTPException
from pydantic import BaseModel,Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inbox import Conversation,Message
from app.models.website import WebsiteSession,WebsiteRequest
from app.models.core import utcnow
from app.services.messaging_service import aware
from app.services.website_service import create_session,authenticated,guest_message,feed,rate_limit
from app.openai_client import run_hotel_agent
router=APIRouter(prefix="/api/chat",tags=["website chat"])

class ChatRequest(BaseModel):
    message:str=Field(min_length=1,max_length=4000)
    requestId:str=Field(min_length=16,max_length=100,pattern=r"^[A-Za-z0-9_-]+$")

@router.post("/session",status_code=201)
def start(request:Request,response:Response,db:Session=Depends(get_db)):
    response.headers["Cache-Control"]="no-store"
    return create_session(db,request)

@router.get("/messages")
def messages(request:Request,response:Response,db:Session=Depends(get_db)):
    response.headers["Cache-Control"]="no-store"
    session=authenticated(db,request)
    rate_limit(db,"poll",session.token_hash,60,60)
    result=feed(db,session);db.commit();return result

@router.delete("/session",status_code=204)
def end(request:Request,db:Session=Depends(get_db)):
    session=authenticated(db,request,lock=True);session.revoked=True;db.commit()

@router.post("/message")
async def message(data:ChatRequest,request:Request,response:Response,db:Session=Depends(get_db)):
    response.headers["Cache-Control"]="no-store"
    text=data.message.strip()
    if not text:raise HTTPException(422,"Message cannot be blank")
    session=authenticated(db,request,lock=True)
    item,generate,history=guest_message(db,session,text,data.requestId)
    reqkey=item.request_key;cid=session.conversation_id
    db.commit() # Persist before calling the model and allow staff takeover during generation.
    if generate:
        try:
            reply=await asyncio.wait_for(asyncio.to_thread(run_hotel_agent,text,history=history),timeout=45)
            failed=False
        except Exception:
            reply="Our team will assist you here when available.";failed=True
        c=db.scalar(select(Conversation).where(Conversation.id==cid).with_for_update())
        item=db.get(WebsiteRequest,reqkey)
        # Skip stale responses when a newer guest message or takeover arrived during generation.
        newest=db.scalar(select(Message.id).where(Message.conversation_id==cid,Message.kind=="guest").order_by(Message.created_at.desc(),Message.id.desc()).limit(1))
        current_session=db.get(WebsiteSession,session.token_hash)
        if not current_session.revoked and aware(current_session.expires_at)>utcnow() and not c.human_owned and c.status!="closed" and newest==item.message_id:
            if failed:c.human_owned=True
            db.add(Message(conversation_id=cid,body=reply[:10000],kind="handoff_ack" if failed else "ai",delivery_status="available"))
        item.state="failed" if failed else "completed";db.commit()
    return {"status":item.state,"requestId":data.requestId,"actions":[
        {"label":"Check availability","type":"availability"},
        {"label":"Talk to staff","type":"prompt","message":"I would like to speak to a person"},
    ]}
