"""Initial tenant, property, guest and reservation schema.
Revision ID: 0001
Revises:
"""
from alembic import op
from app.database import Base
from app.models import core  # noqa: F401
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    for table in Base.metadata.sorted_tables:
        table.create(op.get_bind(), checkfirst=True)

def downgrade():
    for table in reversed(Base.metadata.sorted_tables):
        table.drop(op.get_bind(), checkfirst=True)
