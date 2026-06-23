"""add place_code to opportunities

Revision ID: 90e08f980c90
Revises: 9e9512b0d039
Create Date: 2026-06-16 11:46:54.904457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90e08f980c90'
down_revision: Union[str, Sequence[str], None] = '9e9512b0d039'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column("place_code", sa.String(), nullable=True)
    )
    op.create_index(
        "ix_opportunities_place_code",
        "opportunities",
        ["place_code"],
        unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_opportunities_place_code", table_name="opportunities")
    op.drop_column("opportunities", "place_code")
