from fastapi import APIRouter

from app.services.conversation_service import ChatRequest, handle_chat_message

router = APIRouter()


@router.post("/api/chat/message")
async def chat_message(payload: ChatRequest):
    return await handle_chat_message(payload)
