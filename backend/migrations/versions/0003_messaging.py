"""Durable WhatsApp ingestion and outbox."""
from alembic import op
from app.database import Base
from app.models import messaging
revision="0003"
down_revision="0002"
branch_labels=None
depends_on=None
names=("channel_connections","conversation_routes","webhook_events","delivery_jobs","reply_requests")
def upgrade():
    for name in names: Base.metadata.tables[name].create(op.get_bind())
def downgrade():
    for name in reversed(names): Base.metadata.tables[name].drop(op.get_bind())
