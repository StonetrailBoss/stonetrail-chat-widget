"""Staff authentication and persistent inbox."""
from alembic import op
from app.database import Base
from app.models import inbox
revision="0002"
down_revision="0001"
branch_labels=None
depends_on=None
names=("staff","staff_sessions","conversations","messages","inbox_audit_events")
def upgrade():
    for name in names: Base.metadata.tables[name].create(op.get_bind())
def downgrade():
    for name in reversed(names): Base.metadata.tables[name].drop(op.get_bind())
