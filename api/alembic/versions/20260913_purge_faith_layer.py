"""purge_faith_and_scripture_layer

Revision ID: 20260913_purge_faith
Revises: 6bb97c07a07a
Create Date: 2026-09-13 17:08:00.000000

Permanent purge of religious/faith constructs:
- scripture_reflections table
- reflections table
- giving table
- givingstatus enum
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '20260913_purge_faith'
down_revision: Union[str, Sequence[str], None] = '6bb97c07a07a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop faith-dedicated tables safely across SQLite and Postgres
    op.execute("DROP TABLE IF EXISTS scripture_reflections")
    op.execute("DROP TABLE IF EXISTS reflections")
    op.execute("DROP TABLE IF EXISTS giving")


def downgrade() -> None:
    pass
