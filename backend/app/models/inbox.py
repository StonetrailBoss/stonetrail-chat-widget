from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.core import uid, utcnow

class Staff(Base):
    __tablename__ = "staff"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(30), default="agent")
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class StaffSession(Base):
    __tablename__ = "staff_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    staff_id: Mapped[str] = mapped_column(ForeignKey("staff.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class Conversation(Base):
    __tablename__ = "conversations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    guest_id: Mapped[str | None] = mapped_column(ForeignKey("guests.id"))
    reservation_id: Mapped[str | None] = mapped_column(ForeignKey("reservations.id"))
    subject: Mapped[str] = mapped_column(String(200))
    channel: Mapped[str] = mapped_column(String(30), default="manual")
    status: Mapped[str] = mapped_column(String(30), default="open")
    assigned_to: Mapped[str | None] = mapped_column(ForeignKey("staff.id"))
    human_owned: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class Message(Base):
    __tablename__ = "messages"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), index=True)
    staff_id: Mapped[str | None] = mapped_column(ForeignKey("staff.id"))
    body: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(30))
    delivery_status: Mapped[str] = mapped_column(String(30), default="local_only")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class AuditEvent(Base):
    __tablename__ = "inbox_audit_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    staff_id: Mapped[str] = mapped_column(ForeignKey("staff.id"))
    action: Mapped[str] = mapped_column(String(80))
    target_id: Mapped[str] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
