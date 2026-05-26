import os
from urllib.parse import quote

from app.openai_client import run_hotel_agent
from app.whatsapp_client import send_whatsapp_text

DEFAULT_HANDOFF_MESSAGE = (
    "Hello Stonetrail Villas, I would like to speak with someone about my stay."
)


def get_public_whatsapp_number() -> str:
    """
    Public WhatsApp number used for wa.me handoff links.
    Format must be international format with digits only, no +, spaces, or dashes.
    Example for St. Vincent: 1784XXXXXXX
    """
    return os.getenv("WHATSAPP_PUBLIC_NUMBER", "").strip()


def build_whatsapp_handoff_url(message: str = DEFAULT_HANDOFF_MESSAGE) -> str | None:
    number = get_public_whatsapp_number()
    if not number:
        return None
    return f"https://wa.me/{number}?text={quote(message)}"


def build_whatsapp_handoff_response(session_id: str | None = None) -> dict:
    url = build_whatsapp_handoff_url()

    reply = (
        "Of course. You can continue this conversation with our team on WhatsApp."
        if url
        else "Of course. A member of our team can assist you directly. Please contact Stonetrail Villas by WhatsApp or phone."
    )

    return {
        "type": "handoff",
        "reply": reply,
        "handoff": {
            "channel": "whatsapp",
            "label": "Continue on WhatsApp",
            "url": url,
        },
        "actions": [
            {"label": "Continue on WhatsApp", "type": "link", "url": url},
            {"label": "Check availability"},
            {"label": "View room options"},
        ],
    }


async def handle_incoming_whatsapp_message(payload: dict):
    """
    Handles inbound WhatsApp webhook events from Meta.
    This is for guests who message the hotel directly through WhatsApp.
    """
    try:
        entry = payload.get("entry", [None])[0]
        change = (entry or {}).get("changes", [None])[0]
        value = (change or {}).get("value", {})

        message = value.get("messages", [None])[0]
        if not message:
            return

        from_number = message.get("from")
        text = message.get("text", {}).get("body", "").strip()

        if not from_number:
            return

        if not text:
            await send_whatsapp_text(
                from_number,
                "Thank you for contacting Stonetrail Villas. A member of our team will review your message.",
            )
            return

        ai_reply = run_hotel_agent(text)
        await send_whatsapp_text(from_number, ai_reply)

    except Exception as e:
        print("WhatsApp webhook error:", e)
