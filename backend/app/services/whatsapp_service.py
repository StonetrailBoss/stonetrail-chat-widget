from app.openai_client import get_ai_response
from app.whatsapp_client import send_whatsapp_text


async def handle_incoming_whatsapp_message(payload: dict):
    try:
        entry = payload["entry"][0]
        change = entry["changes"][0]
        value = change["value"]

        message = value.get("messages", [None])[0]
        if not message:
            return

        from_number = message["from"]
        text = message.get("text", {}).get("body", "")

        if not text:
            await send_whatsapp_text(
                from_number,
                "Thank you for contacting Stonetrail Villas. A member of our team will review your message."
            )
            return

        ai_reply = await get_ai_response(
            user_message=text,
            channel="whatsapp",
            guest_phone=from_number
        )

        await send_whatsapp_text(from_number, ai_reply)

    except Exception as e:
        print("WhatsApp webhook error:", e)