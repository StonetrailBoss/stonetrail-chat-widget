import hashlib
import json
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import visitor
from app.db import get_db
from app.models import Conversation, Message, VisitorSession, ChatRequest
from app.config import settings
from app.services.openai_service import answer
from app.services.whatsapp_service import notify_staff

router = APIRouter(prefix="/api/chat", tags=["chat"])

class SessionRequest(BaseModel):
    guest_name: str | None = Field(default=None, max_length=150)

class MessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    requestId: str = Field(min_length=1, max_length=36)

def handoff_actions():
    actions = [{"type": "staff_chat", "label": "Chat with our team"}]
    number = settings.whatsapp_guest_number
    if number and number.isdigit():
        actions.append({"type": "whatsapp", "label": "Open WhatsApp",
                        "url": "https://wa.me/" + number + "?text=" + quote("Hello Stonetrail, I need assistance.")})
    phone = settings.hotel_phone
    if phone and phone.lstrip("+").isdigit():
        actions.append({"type": "phone", "label": "Call the hotel", "url": "tel:" + phone})
    return actions

@router.post("/session")
async def create_session(payload: SessionRequest | None = None, db: AsyncSession = Depends(get_db)):
    conversation = Conversation(guest_name=payload.guest_name if payload else None)
    db.add(conversation)
    await db.flush()
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.add(VisitorSession(token_hash=hashlib.sha256(token.encode()).hexdigest(),
                          conversation_id=conversation.id, expires_at=expires))
    await db.commit()
    return {"sessionToken": token, "expiresAt": expires.isoformat()}

@router.delete("/session", status_code=204)
async def revoke(conversation=Depends(visitor), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(VisitorSession).where(
        VisitorSession.conversation_id == conversation.id))).scalars()
    for row in rows:
        await db.delete(row)
    await db.commit()
    return Response(status_code=204)

@router.get("/messages")
async def messages(conversation=Depends(visitor), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Message).where(Message.session_id == conversation.id)
                            .order_by(Message.created_at, Message.id))).scalars().all()
    return {"messages": [{"id": m.id, "body": m.content, "kind":
            "guest" if m.role == "user" else "reply" if m.role == "staff" else "assistant"}
            for m in rows], "humanOwned": conversation.escalated,
            "actions": handoff_actions() if conversation.escalated else []}

@router.post("/message")
async def chat_message(payload: MessageRequest, conversation=Depends(visitor),
                       db: AsyncSession = Depends(get_db)):
    # Database row lock serializes sends across Render workers and staff takeover.
    conversation = (await db.execute(select(Conversation).where(
        Conversation.id == conversation.id).with_for_update().execution_options(populate_existing=True))).scalar_one()
    request_key = conversation.id + ":" + payload.requestId
    previous = await db.get(ChatRequest, request_key)
    if previous:
        if previous.message != payload.message:
            raise HTTPException(409, "Request ID reused for another message")
        return json.loads(previous.result)
    rows = (await db.execute(select(Message).where(Message.session_id == conversation.id)
                            .order_by(Message.created_at.desc(), Message.id.desc())
                            .limit(settings.max_history_messages))).scalars().all()
    history = [{"role": "assistant" if m.role == "staff" else m.role, "content": m.content}
               for m in reversed(rows)]
    history.append({"role": "user", "content": payload.message})
    try:
        decision = await answer(history, settings.booking_engine_url, conversation.escalated)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(503, "AI concierge unavailable. Retry or use the hotel's contact details.") from exc
    db.add(Message(session_id=conversation.id, role="user", content=payload.message))
    # Flush preserves guest-before-assistant ordering.
    await db.flush()
    was_human_owned = conversation.escalated
    if not conversation.escalated and decision.reply:
        db.add(Message(session_id=conversation.id, role="assistant", content=decision.reply))
    notify = decision.escalate and not conversation.escalated
    if decision.escalate:
        conversation.escalated = True
    result = {"reply": "" if was_human_owned else decision.reply,
              "humanOwned": conversation.escalated, "actions": handoff_actions() if conversation.escalated else [],
              "preferred_channel": decision.channel, "notification": "not_requested"}
    # Staff queue commits regardless of notification provider availability.
    db.add(ChatRequest(id=request_key, message=payload.message, result=json.dumps(result)))
    await db.commit()
    if notify:
        try:
            count = await notify_staff(conversation.id, decision.summary[:1000])
            result["notification"] = "submitted"
            result["recipients"] = count
        except HTTPException:
            result["notification"] = "failed"
        record = await db.get(ChatRequest, request_key)
        record.result = json.dumps(result)
        await db.commit()
    return result
