from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.core import uid, utcnow

class ChannelConnection(Base):
    __tablename__ = "channel_connections"
    id: Mapped[str] = mapped_column(String(36),primary_key=True,default=uid)
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"),index=True)
    phone_number_id: Mapped[str] = mapped_column(String(100),unique=True)
    inbound_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class ConversationRoute(Base):
    __tablename__ = "conversation_routes"
    id: Mapped[str] = mapped_column(String(36),primary_key=True,default=uid)
    connection_id: Mapped[str] = mapped_column(ForeignKey("channel_connections.id"))
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"),unique=True)
    recipient: Mapped[str] = mapped_column(String(40))
    last_inbound_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    __table_args__=(UniqueConstraint("connection_id","recipient",name="uq_channel_recipient"),)

class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    event_key: Mapped[str] = mapped_column(String(64),primary_key=True)
    connection_id: Mapped[str] = mapped_column(ForeignKey("channel_connections.id"))
    provider_id: Mapped[str] = mapped_column(String(200),index=True)
    status: Mapped[str] = mapped_column(String(30))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class DeliveryJob(Base):
    __tablename__ = "delivery_jobs"
    id: Mapped[str] = mapped_column(String(36),primary_key=True,default=uid)
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"),unique=True)
    connection_id: Mapped[str] = mapped_column(ForeignKey("channel_connections.id"))
    purpose: Mapped[str] = mapped_column(String(30),default="staff_reply")
    state: Mapped[str] = mapped_column(String(30),default="queued",index=True)
    attempts: Mapped[int] = mapped_column(Integer,default=0)
    provider_id: Mapped[str | None] = mapped_column(String(200),unique=True)
    error_code: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

class ReplyRequest(Base):
    __tablename__ = "reply_requests"
    request_key: Mapped[str] = mapped_column(String(64),primary_key=True)
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"),unique=True)
