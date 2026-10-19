from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped,mapped_column
from app.database import Base
from app.models.core import utcnow

class WebsiteSession(Base):
    __tablename__="website_sessions"
    token_hash: Mapped[str]=mapped_column(String(64),primary_key=True)
    property_id: Mapped[str]=mapped_column(ForeignKey("properties.id"),index=True)
    conversation_id: Mapped[str | None]=mapped_column(ForeignKey("conversations.id"),unique=True)
    origin: Mapped[str]=mapped_column(String(300))
    expires_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),index=True)
    revoked: Mapped[bool]=mapped_column(Boolean,default=False)

class WebsiteRequest(Base):
    __tablename__="website_requests"
    request_key: Mapped[str]=mapped_column(String(64),primary_key=True)
    session_hash: Mapped[str]=mapped_column(ForeignKey("website_sessions.token_hash"),index=True)
    message_id: Mapped[str]=mapped_column(ForeignKey("messages.id"),unique=True)
    state: Mapped[str]=mapped_column(String(30),default="processing")

class WebsiteRateBucket(Base):
    __tablename__="website_rate_buckets"
    bucket_key: Mapped[str]=mapped_column(String(64),primary_key=True)
    count: Mapped[int]=mapped_column(Integer,default=1)
    expires_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),index=True)
