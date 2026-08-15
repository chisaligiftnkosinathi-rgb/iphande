"""merge heads

Revision ID: c7614bb67711
Revises: 2026063003, 2026063004, 8389f01bed73
Create Date: 2026-08-15 09:36:21.219891

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7614bb67711'
down_revision: Union[str, Sequence[str], None] = ('2026063003', '2026063004', '8389f01bed73')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
