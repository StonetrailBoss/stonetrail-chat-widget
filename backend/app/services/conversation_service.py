from pydantic import BaseModel

from app.openai_client import run_hotel_agent
from app.services.whatsapp_service import build_whatsapp_handoff_response


class ChatRequest(BaseModel):
    sessionId: str | None = None
    message: str
    pageUrl: str | None = None


HUMAN_HANDOFF_PHRASES = [
    "talk to someone",
    "speak to someone",
    "talk to a person",
    "speak to a person",
    "real person",
    "human",
    "live agent",
    "transfer to agent",
    "talk to agent",
    "speak to agent",
    "talk to staff",
    "speak to staff",
    "staff member",
    "front desk",
    "reception",
    "receptionist",
    "representative",
    "customer service",
    "individual",
    "need help from someone",
    "can someone call me",
    "call me",
    "whatsapp",
]

HUMAN_HANDOFF_WORDS = {
    "agent",
    "person",
    "representative",
    "staff",
    "human",
    "individual",
}


def wants_human_handoff(message: str) -> bool:
    text = message.lower().strip()
    if any(phrase in text for phrase in HUMAN_HANDOFF_PHRASES):
        return True

    words = {word.strip(".,!?;:()[]{}\"'") for word in text.split()}
    return bool(words & HUMAN_HANDOFF_WORDS)


def actions_for(message: str) -> list[dict]:
    if wants_human_handoff(message):
        return [
            {"label": "Continue on WhatsApp"},
            {"label": "Check availability"},
            {"label": "View room options"},
        ]

    text = message.lower()
    if any(w in text for w in ["availability", "available", "book", "reservation", "reserve", "room"]):
        return [
            {"label": "Check availability"},
            {"label": "View room options"},
            {"label": "Talk to staff"},
        ]

    return [
        {"label": "Check availability"},
        {"label": "View room options"},
        {"label": "Talk to staff"},
    ]


async def handle_chat_message(payload: ChatRequest) -> dict:
    if wants_human_handoff(payload.message):
        return build_whatsapp_handoff_response(session_id=payload.sessionId)

    reply = run_hotel_agent(payload.message)
    return {
        "type": "text",
        "reply": reply,
        "actions": actions_for(payload.message),
    }
