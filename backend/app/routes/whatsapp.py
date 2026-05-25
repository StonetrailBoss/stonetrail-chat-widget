import os
from fastapi import APIRouter, Request, HTTPException
from app.services.whatsapp_service import handle_incoming_whatsapp_message
from app.whatsapp_client import send_whatsapp_text

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN")


@router.get("/webhook")
async def verify_webhook(request: Request):
    params = request.query_params

    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == VERIFY_TOKEN
    ):
        return int(params.get("hub.challenge"))

    raise HTTPException(status_code=403, detail="Invalid verify token")


@router.post("/webhook")
async def receive_webhook(request: Request):
    payload = await request.json()
    await handle_incoming_whatsapp_message(payload)
    return {"status": "ok"}


@router.post("/send")
async def send_message(to: str, message: str):
    return await send_whatsapp_text(to, message)