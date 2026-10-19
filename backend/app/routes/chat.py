from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models import Conversation, Message
from app.config import settings
from app.services.openai_service import answer
from app.services.whatsapp_service import notify_staff

router = APIRouter(prefix="/api/chat", tags=["chat"])

class SessionRequest(BaseModel):
    guest_name: str | None = Field(default=None, max_length=150)

class MessageRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=4000)

class EscalateRequest(BaseModel):
    session_id: str
    summary: str = Field(default="Guest requests a human agent", max_length=1000)

@router.post("/session")
async def create_session(payload: SessionRequest, db: AsyncSession = Depends(get_db)):
    conversation = Conversation(guest_name=payload.guest_name)
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return {"session_id": conversation.id, "status":"active", "created_at":conversation.created_at}

@router.post("/message")
async def chat_message(payload: MessageRequest, db: AsyncSession = Depends(get_db)):
    conversation = await db.get(Conversation, payload.session_id)
    if not conversation:
        raise HTTPException(404, "Unknown session")
    db.add(Message(session_id=payload.session_id, role="user", content=payload.message))
    await db.commit()
    rows = (await db.execute(select(Message).where(Message.session_id == payload.session_id).order_by(Message.created_at.desc(), Message.id.desc()).limit(settings.max_history_messages))).scalars().all()
    history = [{"role":m.role, "content":m.content} for m in reversed(rows)]
    try:
        reply = await answer(history, settings.booking_engine_url)
    except Exception as exc:
        raise HTTPException(503, "AI concierge temporarily unavailable") from exc
    db.add(Message(session_id=payload.session_id, role="assistant", content=reply))
    await db.commit()
    wants_human = any(s in payload.message.lower() for s in ("talk to someone", "talk to a person", "human agent", "transfer to agent", "speak to staff", "escalate"))
    return {"session_id":payload.session_id, "reply":reply, "actions":([{"type":"escalate", "label":"Contact staff"}] if wants_human else []), "booking_url":settings.booking_engine_url}

@router.get("/history/{session_id}")
async def history(session_id: str, db: AsyncSession = Depends(get_db)):
    if not await db.get(Conversation, session_id):
        raise HTTPException(404, "Unknown session")
    rows = (await db.execute(select(Message).where(Message.session_id == session_id).order_by(Message.created_at, Message.id))).scalars().all()
    return {"session_id":session_id, "messages":[{"role":m.role, "content":m.content, "created_at":m.created_at} for m in rows]}

@router.post("/escalate")
async def escalate(payload: EscalateRequest, db: AsyncSession = Depends(get_db)):
    conversation = await db.get(Conversation, payload.session_id)
    if not conversation:
        raise HTTPException(404, "Unknown session")
    delivered = await notify_staff(payload.session_id, payload.summary)
    conversation.escalated = True
    await db.commit()
    return {"status":"notification_submitted", "recipients":delivered}
