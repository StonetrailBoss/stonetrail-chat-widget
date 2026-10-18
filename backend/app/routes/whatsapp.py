import hashlib,hmac,json,os
from fastapi import APIRouter,Request,HTTPException,Depends
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.services.messaging_service import ingest
router=APIRouter(prefix="/whatsapp",tags=["whatsapp"])

@router.get("/webhook",response_class=PlainTextResponse)
def verify_webhook(request:Request):
    p=request.query_params;expected=os.getenv("WHATSAPP_VERIFY_TOKEN","")
    if not expected or p.get("hub.mode")!="subscribe" or not hmac.compare_digest(p.get("hub.verify_token",""),expected):raise HTTPException(403,"Invalid verify token")
    return p.get("hub.challenge","")

@router.post("/webhook")
async def receive_webhook(request:Request,db:Session=Depends(get_db)):
    body=await request.body()
    if len(body)>1048576:raise HTTPException(413,"Webhook too large")
    secret=os.getenv("META_APP_SECRET","");signature=request.headers.get("x-hub-signature-256","")
    expected="sha256="+hmac.new(secret.encode(),body,hashlib.sha256).hexdigest()
    if not secret or not hmac.compare_digest(signature,expected):raise HTTPException(403,"Invalid webhook signature")
    try:payload=json.loads(body)
    except ValueError:raise HTTPException(422,"Invalid JSON")
    try:
        result=ingest(db,payload);db.commit()
    except IntegrityError:
        db.rollback()
        # A concurrent duplicate won the unique constraint. Reconcile every item in the batch.
        result=ingest(db,payload);db.commit()
    except (AttributeError,TypeError,ValueError):
        db.rollback();raise HTTPException(422,"Invalid webhook payload shape")
    return {"status":"ok",**result}

@router.post("/send")
def legacy_send_disabled():
    raise HTTPException(410,"Use the authenticated staff inbox delivery queue")
