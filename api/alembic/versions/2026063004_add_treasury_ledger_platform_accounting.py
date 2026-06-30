"""add_treasury_ledger_platform_accounting

Revision ID: 2026063004
Revises: 2026063002
Create Date: 2026-06-30 00:00:00.000000

Implements Execution Safety Layer Phase 4A:
- TreasuryLedger table for platform revenue accounting
- Separates platform fees from merchant earnings for clear accounting
- Immutable after creation (except settlement metadata)
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '2026063004'
down_revision = '2026063002'
branch_labels = None
depends_on = None


def upgrade():
    # Create enums
    treasury_entry_type_enum = postgresql.ENUM(
        'platform_fee',
        'adjustment',
        'refund',
        'reversal',
        'chargeback',
        name='treasury_entry_type'
    )
    treasury_entry_type_enum.create(op.get_bind())

    treasury_ledger_status_enum = postgresql.ENUM(
        'created',
        'allocated',
        'settled',
        'reversed',
        name='treasury_ledger_status'
    )
    treasury_ledger_status_enum.create(op.get_bind())

    # Create treasury_ledgers table
    op.create_table(
        'treasury_ledgers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('fee_ledger_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='ZAR'),
        sa.Column('entry_type', sa.String(), nullable=False, server_default='platform_fee'),
        sa.Column('owner', sa.String(), nullable=False, server_default='GLOBAL_IT_BUSINESS_SOLUTIONS', index=True),
        sa.Column('status', sa.String(), nullable=False, server_default='created'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.Column('allocated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('settled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reversed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('settlement_reference', sa.String(), nullable=True),
        sa.Column('settlement_memo', sa.String(), nullable=True),
        sa.Column('continuity_event_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reversal_continuity_event_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('idempotency_key', sa.String(), nullable=True, unique=True),
        sa.Column('provider_event_id', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['payment_intent_id'], ['payment_intents.id'], ),
        sa.ForeignKeyConstraint(['fee_ledger_id'], ['fee_ledgers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for treasury_ledgers
    op.create_index('ix_treasury_ledgers_payment_intent_id', 'treasury_ledgers', ['payment_intent_id'])
    op.create_index('ix_treasury_ledgers_fee_ledger_id', 'treasury_ledgers', ['fee_ledger_id'])
    op.create_index('ix_treasury_ledgers_owner', 'treasury_ledgers', ['owner'])
    op.create_index('ix_treasury_ledgers_idempotency_key', 'treasury_ledgers', ['idempotency_key'])
    op.create_index('ix_treasury_ledgers_provider_event_id', 'treasury_ledgers', ['provider_event_id'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_treasury_ledgers_provider_event_id', table_name='treasury_ledgers')
    op.drop_index('ix_treasury_ledgers_idempotency_key', table_name='treasury_ledgers')
    op.drop_index('ix_treasury_ledgers_owner', table_name='treasury_ledgers')
    op.drop_index('ix_treasury_ledgers_fee_ledger_id', table_name='treasury_ledgers')
    op.drop_index('ix_treasury_ledgers_payment_intent_id', table_name='treasury_ledgers')

    # Drop table
    op.drop_table('treasury_ledgers')

    # Drop enums
    postgresql.ENUM('treasury_ledger_status').drop(op.get_bind())
    postgresql.ENUM('treasury_entry_type').drop(op.get_bind())
