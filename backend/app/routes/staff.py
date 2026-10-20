from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import staff
from app.db import get_db
from app.models import Conversation, Message

router = APIRouter(prefix="/api/staff", tags=["staff"], dependencies=[Depends(staff)])

class Reply(BaseModel):
    body: str = Field(min_length=1, max_length=4000)

class Ownership(BaseModel):
    human_owned: bool

async def get_conversation(id, db):
    c = (await db.execute(select(Conversation).where(Conversation.id == id)
                          .with_for_update().execution_options(populate_existing=True))).scalar_one_or_none()
    if not c:
        raise HTTPException(404, "Conversation not found")
    return c

@router.get("/conversations")
async def conversations(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Conversation).order_by(Conversation.created_at.desc())
                            .limit(100))).scalars().all()
    return [{"id": c.id, "subject": c.guest_name or "Website guest",
             "human_owned": c.escalated, "created_at": c.created_at} for c in rows]

@router.get("/conversations/{id}")
async def detail(id: str, db: AsyncSession = Depends(get_db)):
    c = await db.get(Conversation, id)
    if not c:
        raise HTTPException(404, "Conversation not found")
    rows = (await db.execute(select(Message).where(Message.session_id == id)
                            .order_by(Message.created_at, Message.id))).scalars().all()
    return {"id": c.id, "human_owned": c.escalated,
            "messages": [{"id": m.id, "role": m.role, "body": m.content} for m in rows]}

@router.patch("/conversations/{id}")
async def ownership(id: str, payload: Ownership, db: AsyncSession = Depends(get_db)):
    c = await get_conversation(id, db)
    c.escalated = payload.human_owned
    await db.commit()
    return {"human_owned": c.escalated}

@router.post("/conversations/{id}/messages")
async def reply(id: str, payload: Reply, db: AsyncSession = Depends(get_db)):
    c = await get_conversation(id, db)
    c.escalated = True
    db.add(Message(session_id=id, role="staff", content=payload.body))
    await db.commit()
    return {"status": "saved"}
