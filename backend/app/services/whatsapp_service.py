import httpx
from fastapi import HTTPException
from app.config import settings

async def notify_staff(session_id: str, summary: str):
    numbers = [x.strip() for x in settings.whatsapp_staff_numbers.split(",") if x.strip()]
    if not (settings.whatsapp_access_token and settings.whatsapp_phone_number_id and numbers):
        raise HTTPException(503, "WhatsApp escalation is not configured")
    url = f"https://graph.facebook.com/v22.0/{settings.whatsapp_phone_number_id}/messages"
    headers = {"Authorization": f"Bearer {settings.whatsapp_access_token}"}
    delivered = 0
    async with httpx.AsyncClient(timeout=15) as client:
        for number in numbers:
            # WhatsApp free-form messages require an open service window; outside it use an approved template.
            payload = {"messaging_product":"whatsapp", "to":number, "type":"text", "text":{"body":f"Guest requests staff assistance. Session: {session_id}. Summary: {summary[:500]}"}}
            try:
                r = await client.post(url, json=payload, headers=headers)
                r.raise_for_status()
                delivered += 1
            except httpx.HTTPError:
                pass
    if delivered == 0:
        raise HTTPException(502, "Staff notification could not be sent")
    return delivered
