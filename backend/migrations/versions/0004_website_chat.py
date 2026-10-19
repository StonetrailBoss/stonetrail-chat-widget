"""Secure website visitor sessions and message request deduplication."""
from alembic import op
from app.database import Base
from app.models import website
revision="0004"
down_revision="0003"
branch_labels=None
depends_on=None
names=("website_sessions","website_requests","website_rate_buckets")
def upgrade():
    for name in names:Base.metadata.tables[name].create(op.get_bind())
def downgrade():
    for name in reversed(names):Base.metadata.tables[name].drop(op.get_bind())
