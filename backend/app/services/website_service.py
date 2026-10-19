"""Website visitor capabilities and persistence. CORS is not authentication."""
import hashlib,hmac,os,secrets
from datetime import timedelta
from fastapi import HTTPException,Request
from sqlalchemy import select,update,delete
from sqlalchemy.exc import IntegrityError
from app.models.core import Property,utcnow
from app.models.inbox import Conversation,Message
from app.models.website import WebsiteSession,WebsiteRequest,WebsiteRateBucket
from app.services.messaging_service import aware,key
from app.services.handoff import wants_human_handoff

_DEV_RATE_SECRET=secrets.token_hex(32)
VISIBLE_KINDS=("guest","reply","ai","handoff_ack")
def website_origins():
    return {s.strip() for s in os.getenv("WEBSITE_ALLOWED_ORIGINS","https://stonetrailvillas.com,https://www.stonetrailvillas.com,http://localhost:5173").split(",") if s.strip()}
def require_origin(request):
    origin=request.headers.get("origin","")
    if origin not in website_origins():raise HTTPException(403,"Website origin not allowed")
    return origin

def rate_limit(db,scope,identifier,limit,seconds):
    now=utcnow();period=int(now.timestamp())//seconds
    secret=os.getenv("WEBSITE_RATE_LIMIT_SECRET") or _DEV_RATE_SECRET
    digest=hmac.new(secret.encode(),f"{scope}|{identifier}|{period}".encode(),hashlib.sha256).hexdigest()
    expires=now+timedelta(seconds=seconds*2)
    # Atomic increment, with a savepoint for a racing first insert.
    changed=db.execute(update(WebsiteRateBucket).where(WebsiteRateBucket.bucket_key==digest,WebsiteRateBucket.count<limit).values(count=WebsiteRateBucket.count+1)).rowcount
    if changed:return
    if db.get(WebsiteRateBucket,digest):raise HTTPException(429,"Chat rate limit reached; please try later",headers={"Retry-After":str(seconds)})
    try:
        with db.begin_nested():db.add(WebsiteRateBucket(bucket_key=digest,count=1,expires_at=expires));db.flush()
    except IntegrityError:
        changed=db.execute(update(WebsiteRateBucket).where(WebsiteRateBucket.bucket_key==digest,WebsiteRateBucket.count<limit).values(count=WebsiteRateBucket.count+1)).rowcount
        if not changed:raise HTTPException(429,"Chat rate limit reached",headers={"Retry-After":str(seconds)})

def create_session(db,request):
    origin=require_origin(request)
    prop=os.getenv("WEBSITE_PROPERTY_ID","")
    if not prop or not db.get(Property,prop):raise HTTPException(503,"Website chat property is not configured")
    client=request.client.host if request.client else "unknown"
    rate_limit(db,"session",client,20,3600)
    # Retain no raw client IP. Expired rate counters are pruned during session creation.
    db.execute(delete(WebsiteRateBucket).where(WebsiteRateBucket.expires_at<utcnow()))
    token=secrets.token_urlsafe(48);digest=hashlib.sha256(token.encode()).hexdigest()
    session=WebsiteSession(token_hash=digest,property_id=prop,origin=origin,expires_at=utcnow()+timedelta(hours=24))
    db.add(session);db.commit()
    return {"sessionToken":token,"expiresAt":session.expires_at}

def authenticated(db,request,lock=False):
    origin=require_origin(request);auth=request.headers.get("authorization","")
    if not auth.startswith("Bearer ") or len(auth)>200:raise HTTPException(401,"Visitor session required")
    digest=hashlib.sha256(auth[7:].encode()).hexdigest()
    stmt=select(WebsiteSession).where(WebsiteSession.token_hash==digest)
    if lock:stmt=stmt.with_for_update()
    session=db.scalar(stmt)
    if not session or session.revoked or session.origin!=origin or aware(session.expires_at)<=utcnow():raise HTTPException(401,"Visitor session expired or unavailable")
    return session

def guest_message(db,session,text,request_id):
    reqkey=key(session.token_hash,request_id)
    old=db.get(WebsiteRequest,reqkey)
    if old:
        if db.get(Message,old.message_id).body!=text:raise HTTPException(409,"Message request ID already used")
        return old,False,None
    rate_limit(db,"message",session.token_hash,30,60)
    if not session.conversation_id:
        c=Conversation(property_id=session.property_id,subject="Website guest inquiry",channel="website",human_owned=os.getenv("WEBSITE_AI_ENABLED","false").lower()!="true")
        db.add(c);db.flush();session.conversation_id=c.id
    c=db.scalar(select(Conversation).where(Conversation.id==session.conversation_id).with_for_update())
    c.status="open"
    m=Message(conversation_id=c.id,body=text,kind="guest",delivery_status="received")
    db.add(m);db.flush()
    item=WebsiteRequest(request_key=reqkey,session_hash=session.token_hash,message_id=m.id)
    db.add(item)
    handoff=wants_human_handoff(text)
    if handoff:c.human_owned=True
    if c.human_owned or os.getenv("WEBSITE_AI_ENABLED","false").lower()!="true":
        c.human_owned=True;item.state="completed"
        if handoff or not db.scalar(select(Message.id).where(Message.conversation_id==c.id,Message.kind=="handoff_ack")):
            db.add(Message(conversation_id=c.id,body="Your message has been sent to our team. Staff replies will appear here when available.",kind="handoff_ack",delivery_status="available"))
        return item,False,None
    history=[{"role":"user" if msg.kind=="guest" else "assistant","content":msg.body} for msg in reversed(list(db.scalars(select(Message).where(Message.conversation_id==c.id,Message.kind.in_(("guest","reply","ai")),Message.id!=m.id).order_by(Message.created_at.desc(),Message.id.desc()).limit(30))))]
    return item,True,history

def feed(db,session):
    if not session.conversation_id:return {"messages":[],"humanOwned":False,"status":"new"}
    c=db.get(Conversation,session.conversation_id)
    # Internal notes, internal system events, staff identities and reservations never leave this boundary.
    rows=list(db.scalars(select(Message).where(Message.conversation_id==c.id,Message.kind.in_(VISIBLE_KINDS)).order_by(Message.created_at.desc(),Message.id.desc()).limit(100)))
    return {"messages":[{"id":m.id,"body":m.body,"kind":m.kind,"createdAt":m.created_at} for m in reversed(rows)],"humanOwned":c.human_owned,"status":c.status}
