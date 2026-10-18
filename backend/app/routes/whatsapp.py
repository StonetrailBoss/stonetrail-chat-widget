import os
from fastapi import APIRouter, Request, HTTPException, Depends
from app.routes.admin import require_admin
from pydantic import BaseModel

from app.services.whatsapp_service import handle_incoming_whatsapp_message
from app.whatsapp_client import send_whatsapp_text

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")


class WhatsAppSendRequest(BaseModel):
    to: str
    message: str


@router.get("/webhook")
async def verify_webhook(request: Request):
    params = request.query_params

    if (
        params.get("hub.mode") == "subscribe"
        and VERIFY_TOKEN
        and params.get("hub.verify_token") == VERIFY_TOKEN
    ):
        return int(params.get("hub.challenge"))

    raise HTTPException(status_code=403, detail="Invalid verify token")


@router.post("/webhook")
async def receive_webhook(request: Request):
    import hashlib, hmac
    secret = os.getenv("META_APP_SECRET")
    signature = request.headers.get("x-hub-signature-256", "")
    body = await request.body()
    if not secret or not signature.startswith("sha256=") or not hmac.compare_digest(
        signature, "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    ):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")
    payload = await request.json()
    await handle_incoming_whatsapp_message(payload)
    return {"status": "ok"}


@router.post("/send", dependencies=[Depends(require_admin)])
async def send_message(payload: WhatsAppSendRequest):
    return await send_whatsapp_text(payload.to, payload.message)
