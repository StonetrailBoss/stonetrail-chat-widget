from fastapi import APIRouter
from pydantic import BaseModel
from app.openai_client import run_hotel_agent

router = APIRouter()

class ChatRequest(BaseModel):
    sessionId: str | None = None
    message: str
    pageUrl: str | None = None

def _actions_for(message: str):
    text = message.lower()
    if any(w in text for w in ["availability", "available", "book", "reservation", "room"]):
        return [
            {"label": "Check availability"},
            {"label": "View room options"},
            {"label": "Talk to staff"},
        ]
    return [
        {"label": "Check availability"},
        {"label": "View room options"},
        #{"label": "Airport transfer"},
        {"label": "Talk to staff"},
    ]

@router.post("/api/chat/message")
async def chat_message(payload: ChatRequest):
    reply = run_hotel_agent(payload.message)
    return {"type": "text", "reply": reply, "actions": _actions_for(payload.message)}
