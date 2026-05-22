from fastapi import APIRouter
from pydantic import BaseModel

from app.openai_client import run_hotel_agent

router = APIRouter()


class ChatRequest(BaseModel):
    sessionId: str | None = None
    message: str
    pageUrl: str | None = None


@router.post("/message")
async def chat_message(payload: ChatRequest):
    reply = run_hotel_agent(payload.message)

    return {
        "type": "text",
        "reply": reply,
        "actions": [
            {"label": "Check availability"},
            {"label": "View room options"},
            {"label": "Airport transfer"},
            {"label": "Talk to staff"},
        ],
    }