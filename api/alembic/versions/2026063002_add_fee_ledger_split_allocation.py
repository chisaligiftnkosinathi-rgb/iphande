"""Add fee ledger for payment split allocation

Revision ID: 2026063002
Revises: 2026063001
Create Date: 2026-06-30 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '2026063002'
down_revision: Union[str, Sequence[str], None] = '2026063001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add FeeLedger table."""

    # Create fee_ledgers table
    op.create_table(
        'fee_ledgers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='ZAR'),
        sa.Column('platform_fee_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default='10'),
        sa.Column('platform_fee_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('provider_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('platform_account_name', sa.String(), nullable=False, server_default='GLOBAL_IT_BUSINESS_SOLUTIONS'),
        sa.Column('status', sa.String(), nullable=False, server_default='created'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('allocated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('settled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('earning_ledger_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('treasury_transaction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('fee_allocation_continuity_event_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['payment_intent_id'], ['payment_intents.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('payment_intent_id'),
    )
    op.create_index(op.f('ix_fee_ledgers_payment_intent_id'), 'fee_ledgers', ['payment_intent_id'], unique=False)
    op.create_index(op.f('ix_fee_ledgers_platform_account_name'), 'fee_ledgers', ['platform_account_name'], unique=False)
    op.create_index(op.f('ix_fee_ledgers_earning_ledger_id'), 'fee_ledgers', ['earning_ledger_id'], unique=False)
    op.create_index(op.f('ix_fee_ledgers_treasury_transaction_id'), 'fee_ledgers', ['treasury_transaction_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema: Remove FeeLedger table."""

    op.drop_index(op.f('ix_fee_ledgers_treasury_transaction_id'), table_name='fee_ledgers')
    op.drop_index(op.f('ix_fee_ledgers_earning_ledger_id'), table_name='fee_ledgers')
    op.drop_index(op.f('ix_fee_ledgers_platform_account_name'), table_name='fee_ledgers')
    op.drop_index(op.f('ix_fee_ledgers_payment_intent_id'), table_name='fee_ledgers')
    op.drop_table('fee_ledgers')
