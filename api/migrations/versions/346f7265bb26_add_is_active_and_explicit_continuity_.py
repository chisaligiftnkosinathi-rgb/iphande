"""Add is_active and explicit continuity event fields

Revision ID: 346f7265bb26
Revises: 
Create Date: 2026-06-15 13:45:53.717950

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '346f7265bb26'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns to continuity_events
    op.add_column('continuity_events', sa.Column('evidence_type', sa.String(), nullable=True))
    op.add_column('continuity_events', sa.Column('title', sa.String(), nullable=True))
    op.add_column('continuity_events', sa.Column('description', sa.String(), nullable=True))
    op.add_column('continuity_events', sa.Column('source', sa.String(), nullable=True))

    # Add is_active to profiles, with default True so existing records don't fail NOT NULL constraint
    op.add_column('profiles', sa.Column('is_active', sa.Boolean(), server_default=sa.text('false'), nullable=False))

def downgrade() -> None:
    # Remove columns from continuity_events
    op.drop_column('continuity_events', 'source')
    op.drop_column('continuity_events', 'description')
    op.drop_column('continuity_events', 'title')
    op.drop_column('continuity_events', 'evidence_type')

    # Remove is_active from profiles
    op.drop_column('profiles', 'is_active')
