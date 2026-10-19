import secrets, os
from datetime import datetime, timedelta, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.core import Property, Guest, Reservation
from app.models.inbox import Staff, StaffSession, Conversation, Message, AuditEvent
from app.models.website import WebsiteSession
from app.services.messaging_service import aware
from app.models.messaging import ChannelConnection, DeliveryJob, ReplyRequest
from app.services.messaging_service import queue_reply, cancel_ai, key
from app.whatsapp_client import configured
from app.staff_security import hash_password, verify_password, token_hash, current_staff, manager

router = APIRouter(prefix="/api/staff", tags=["staff inbox"])
class Login(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)
class StaffCreate(Login):
    password: str = Field(min_length=12, max_length=128)
    role: Literal["manager", "agent", "auditor"] = "agent"

def profile(u):
    return {"id":u.id,"email":u.email,"role":u.role,"property_id":u.property_id}

def audit(db, user, action, target):
    db.add(AuditEvent(property_id=user.property_id, staff_id=user.id, action=action, target_id=target))

def writable(user):
    if user.role == "auditor": raise HTTPException(403,"Read-only account")

@router.post("/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.scalar(select(Staff).where(Staff.email == data.email.strip().lower()))
    # Run the same password work for unknown accounts to reduce timing differences.
    valid = verify_password(data.password, user.password_hash if user else "0"*32+":"+"0"*128)
    if not user or not valid or not user.active: raise HTTPException(401,"Invalid credentials")
    token = secrets.token_urlsafe(48)
    db.add(StaffSession(token_hash=token_hash(token),staff_id=user.id,expires_at=datetime.now(timezone.utc)+timedelta(hours=8)))
    db.commit()
    return {"access_token":token,"token_type":"bearer","user":profile(user)}

@router.get("/me")
def me(user: Staff = Depends(current_staff)): return profile(user)

@router.post("/logout", status_code=204)
def logout(authorization: str = Header(), user: Staff = Depends(current_staff), db: Session = Depends(get_db)):
    db.delete(db.get(StaffSession, token_hash(authorization[7:])))
    db.commit()

@router.get("/users")
def users(user: Staff = Depends(current_staff), db: Session = Depends(get_db)):
    return [profile(u) for u in db.scalars(select(Staff).where(Staff.property_id==user.property_id,Staff.active==True))]

@router.post("/users", status_code=201)
def create_user(data: StaffCreate, user: Staff = Depends(manager), db: Session = Depends(get_db)):
    email=data.email.strip().lower()
    if db.scalar(select(Staff).where(Staff.email==email)): raise HTTPException(409,"Email already registered")
    item=Staff(property_id=user.property_id,email=email,password_hash=hash_password(data.password),role=data.role)
    db.add(item); db.flush(); audit(db,user,"staff_created",item.id); db.commit()
    return profile(item)

class NewConversation(BaseModel):
    subject: str = Field(min_length=1,max_length=200)
    body: str = Field(min_length=1,max_length=10000)
    guest_id: str | None = None
    reservation_id: str | None = None

def scoped(db,user,cid):
    item=db.scalar(select(Conversation).where(Conversation.id==cid,Conversation.property_id==user.property_id).with_for_update())
    if not item: raise HTTPException(404,"Conversation not found")
    return item

def summary(c):
    return {k:getattr(c,k) for k in ("id","subject","channel","status","assigned_to","human_owned","guest_id","reservation_id","created_at")}

@router.get("/conversations")
def conversations(user: Staff = Depends(current_staff), db: Session = Depends(get_db)):
    return [summary(c) for c in db.scalars(select(Conversation).where(Conversation.property_id==user.property_id).order_by(Conversation.created_at.desc()).limit(200))]

@router.post("/conversations",status_code=201)
def create_conversation(data: NewConversation,user: Staff = Depends(current_staff),db: Session = Depends(get_db)):
    writable(user)
    if data.guest_id:
        g=db.get(Guest,data.guest_id)
        if not g or g.property_id!=user.property_id: raise HTTPException(422,"Invalid guest")
    if data.reservation_id:
        r=db.get(Reservation,data.reservation_id)
        if not r or r.property_id!=user.property_id or (data.guest_id and r.guest_id!=data.guest_id): raise HTTPException(422,"Invalid reservation")
    c=Conversation(property_id=user.property_id,subject=data.subject,guest_id=data.guest_id,reservation_id=data.reservation_id)
    db.add(c);db.flush()
    db.add(Message(conversation_id=c.id,staff_id=user.id,body=data.body,kind="intake"))
    audit(db,user,"conversation_created",c.id);db.commit()
    return summary(c)

@router.get("/conversations/{cid}")
def detail(cid: str,user: Staff=Depends(current_staff),db: Session=Depends(get_db)):
    c=scoped(db,user,cid)
    return {**summary(c),"messages":[{"id":m.id,"body":m.body,"kind":m.kind,"delivery_status":m.delivery_status,"created_at":m.created_at,"error_code":(db.scalar(select(DeliveryJob.error_code).where(DeliveryJob.message_id==m.id)))} for m in db.scalars(select(Message).where(Message.conversation_id==cid).order_by(Message.created_at,Message.id))]}

class Update(BaseModel):
    status: Literal["open","pending","closed"] | None = None
    assigned_to: str | None = None
    human_owned: bool | None = None

@router.patch("/conversations/{cid}")
def update(cid: str,data: Update,user: Staff=Depends(current_staff),db: Session=Depends(get_db)):
    writable(user);c=scoped(db,user,cid)
    if "assigned_to" in data.model_fields_set and data.assigned_to:
        assignee=db.get(Staff,data.assigned_to)
        if not assignee or not assignee.active or assignee.property_id!=user.property_id or assignee.role=="auditor": raise HTTPException(422,"Invalid assignee")
    if data.human_owned is False and user.role!="manager": raise HTTPException(403,"Manager required to release handoff")
    for k,v in data.model_dump(exclude_unset=True).items():
        if k in ("status","human_owned") and v is None: raise HTTPException(422,"Value cannot be null")
        setattr(c,k,v)
    if c.assigned_to: c.human_owned=True
    if c.human_owned or c.status=="closed": cancel_ai(db,cid)
    audit(db,user,"conversation_updated",cid);db.commit();return summary(c)

class NewMessage(BaseModel):
    body: str = Field(min_length=1,max_length=10000)
    kind: Literal["note","reply"] = "note"

@router.post("/conversations/{cid}/messages",status_code=201)
def message(cid: str,data: NewMessage,user: Staff=Depends(current_staff),db: Session=Depends(get_db),idempotency_key: str | None=Header(default=None)):
    writable(user);c=scoped(db,user,cid)
    reqkey=None
    if data.kind=="reply" and c.channel in ("whatsapp","website"):
        if not idempotency_key or not 16<=len(idempotency_key)<=128:raise HTTPException(422,"Idempotency-Key (16–128 characters) required for delivery")
        reqkey=key(user.property_id,user.id,idempotency_key)
        existing=db.get(ReplyRequest,reqkey)
        if existing:
            old=db.get(Message,existing.message_id)
            if old.conversation_id!=cid or old.body!=data.body:raise HTTPException(409,"Idempotency key already used for another reply")
            return {"status":old.delivery_status,"message_id":old.id,"detail":"Existing reply returned; no duplicate queued"}
    if c.status=="closed": raise HTTPException(409,"Reopen conversation before adding messages")
    m=Message(conversation_id=cid,staff_id=user.id,body=data.body,kind=data.kind)
    db.add(m)
    if data.kind=="reply" and c.channel=="whatsapp":
        if os.getenv("WHATSAPP_SEND_ENABLED","false").lower()!="true" or not configured():raise HTTPException(409,"WhatsApp sending is disabled or incomplete")
        c.human_owned=True;cancel_ai(db,cid)
        queue_reply(db,c,m)
        db.add(ReplyRequest(request_key=reqkey,message_id=m.id))
    if data.kind=="reply" and c.channel=="website":
        visitor=db.scalar(select(WebsiteSession).where(WebsiteSession.conversation_id==cid))
        if not visitor or visitor.revoked or aware(visitor.expires_at)<=datetime.now(timezone.utc):raise HTTPException(409,"Website visitor session has expired")
        c.human_owned=True;m.delivery_status="available";db.flush()
        db.add(ReplyRequest(request_key=reqkey,message_id=m.id))
    audit(db,user,"message_"+data.kind,cid);db.commit()
    return {"status":m.delivery_status,"message_id":m.id,"detail":"Queued for WhatsApp delivery" if m.delivery_status=="queued" else "Available to website visitor" if m.delivery_status=="available" else "Saved locally; no external message sent"}

class WhatsAppConnection(BaseModel):
    phone_number_id: str=Field(pattern=r"^\d{5,100}$")

@router.post("/channels/whatsapp")
def connect_whatsapp(data:WhatsAppConnection,user:Staff=Depends(manager),db:Session=Depends(get_db)):
    if data.phone_number_id!=os.getenv("WHATSAPP_PHONE_NUMBER_ID"):raise HTTPException(422,"Phone number ID must match the configured backend account")
    existing=db.scalar(select(ChannelConnection).where(ChannelConnection.phone_number_id==data.phone_number_id))
    if existing and existing.property_id!=user.property_id:raise HTTPException(409,"Account already mapped")
    if not existing:
        existing=ChannelConnection(property_id=user.property_id,phone_number_id=data.phone_number_id)
        db.add(existing);db.flush();audit(db,user,"whatsapp_account_mapped",existing.id);db.commit()
    return {"id":existing.id,"status":"configured_unverified"}

@router.get("/channels")
def channels(user: Staff=Depends(current_staff),db:Session=Depends(get_db)):
    connection=db.scalar(select(ChannelConnection).where(ChannelConnection.property_id==user.property_id))
    state="not_connected"
    if connection:
        state="verified_send_receive" if connection.inbound_at and connection.delivered_at else "inbound_verified" if connection.inbound_at else "configured_unverified"
    return [{"channel":"whatsapp","status":state,"sending_enabled":os.getenv("WHATSAPP_SEND_ENABLED","false").lower()=="true","configured":configured(),"last_inbound_at":connection.inbound_at if connection else None,"last_delivered_at":connection.delivered_at if connection else None}]+[{"channel":"website","status":"configured" if os.getenv("WEBSITE_PROPERTY_ID")==user.property_id else "not_connected"}]+[{"channel":c,"status":"not_connected"} for c in ["instagram","email","booking.com"]]
