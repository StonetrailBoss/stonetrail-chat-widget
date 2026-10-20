import hashlib
import secrets
from datetime import datetime, timezone
from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db import get_db
from app.models import VisitorSession, Conversation

async def visitor(authorization: str = Header(default=""), db: AsyncSession = Depends(get_db)):
    token = authorization.removeprefix("Bearer ")
    session = await db.get(VisitorSession, hashlib.sha256(token.encode()).hexdigest())
    if not session or session.expires_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired. Start a new chat.")
    conversation = await db.get(Conversation, session.conversation_id)
    if not conversation:
        raise HTTPException(401, "Session unavailable")
    return conversation

def staff(authorization: str = Header(default="")):
    if not settings.admin_api_key or not secrets.compare_digest(
        authorization, "Bearer " + settings.admin_api_key
    ):
        raise HTTPException(401, "Staff access denied")
