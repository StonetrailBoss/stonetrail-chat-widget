from fastapi import APIRouter
from app.openai_client import run_hotel_agent

router = APIRouter()


@router.post("/api/chat/message")
async def chat_message(payload: dict):
    message = payload.get("message", "")

    reply = run_hotel_agent(message)

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