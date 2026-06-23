"""make opportunity_id nullable for river bridge

Revision ID: 1a2b3c4d5e6f
Revises: 90e08f980c90
Create Date: 2026-06-22 05:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = '90e08f980c90'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility if needed, though Railway is likely Postgres
    with op.batch_alter_table('timeline_events', schema=None) as batch_op:
        batch_op.alter_column('opportunity_id',
               existing_type=sa.VARCHAR(),
               nullable=True)

def downgrade() -> None:
    with op.batch_alter_table('timeline_events', schema=None) as batch_op:
        batch_op.alter_column('opportunity_id',
               existing_type=sa.VARCHAR(),
               nullable=False)
