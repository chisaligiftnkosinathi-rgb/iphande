"""Add financial core: MerchantAccount and EarningLedger

Revision ID: 2026063001
Revises: 368602c8dcc7
Create Date: 2026-06-30 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '2026063001'
down_revision: Union[str, Sequence[str], None] = '368602c8dcc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add MerchantAccount and EarningLedger tables."""

    # Create merchant_accounts table
    op.create_table(
        'merchant_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('bank_name', sa.String(), nullable=False),
        sa.Column('account_holder_name', sa.String(), nullable=False),
        sa.Column('account_number', sa.String(), nullable=False),
        sa.Column('branch_code', sa.String(), nullable=False),
        sa.Column('account_type', sa.String(), nullable=False, server_default='Cheque'),
        sa.Column('verification_status', sa.Enum('unverified', 'verified', 'suspended', 'rejected', name='merchantverificationstatus'), nullable=False, server_default='unverified'),
        sa.Column('verification_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('payout_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('minimum_balance_for_payout', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('suspension_reason', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_merchant_accounts_user_id'), 'merchant_accounts', ['user_id'], unique=False)

    # Create earning_ledgers table
    op.create_table(
        'earning_ledgers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('merchant_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payment_intent_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('opportunity_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='ZAR'),
        sa.Column('status', sa.Enum('pending', 'available', 'paid', 'reversed', name='earningledgerstatus'), nullable=False, server_default='pending'),
        sa.Column('pending_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('available_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reversed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('payout_batch_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('payout_request_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reversal_reason', sa.String(), nullable=True),
        sa.Column('reversal_triggered_by', sa.String(), nullable=True),
        sa.Column('reversal_notes', sa.Text(), nullable=True),
        sa.Column('created_continuity_event_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status_change_continuity_event_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['merchant_account_id'], ['merchant_accounts.id'], ),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ),
        sa.ForeignKeyConstraint(['payment_intent_id'], ['payment_intents.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['profiles.user_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('payment_intent_id'),
    )
    op.create_index(op.f('ix_earning_ledgers_merchant_account_id'), 'earning_ledgers', ['merchant_account_id'], unique=False)
    op.create_index(op.f('ix_earning_ledgers_opportunity_id'), 'earning_ledgers', ['opportunity_id'], unique=False)
    op.create_index(op.f('ix_earning_ledgers_payment_intent_id'), 'earning_ledgers', ['payment_intent_id'], unique=False)
    op.create_index(op.f('ix_earning_ledgers_user_id'), 'earning_ledgers', ['user_id'], unique=False)
    op.create_index(op.f('ix_earning_ledgers_payout_batch_id'), 'earning_ledgers', ['payout_batch_id'], unique=False)
    op.create_index(op.f('ix_earning_ledgers_payout_request_id'), 'earning_ledgers', ['payout_request_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema: Remove MerchantAccount and EarningLedger tables."""

    # Drop earning_ledgers table first (has foreign keys to merchant_accounts)
    op.drop_index(op.f('ix_earning_ledgers_payout_request_id'), table_name='earning_ledgers')
    op.drop_index(op.f('ix_earning_ledgers_payout_batch_id'), table_name='earning_ledgers')
    op.drop_index(op.f('ix_earning_ledgers_payment_intent_id'), table_name='earning_ledgers')
    op.drop_index(op.f('ix_earning_ledgers_opportunity_id'), table_name='earning_ledgers')
    op.drop_index(op.f('ix_earning_ledgers_merchant_account_id'), table_name='earning_ledgers')
    op.drop_index(op.f('ix_earning_ledgers_user_id'), table_name='earning_ledgers')
    op.drop_table('earning_ledgers')

    # Drop enum for earning_ledgers
    sa.Enum('pending', 'available', 'paid', 'reversed', name='earningledgerstatus').drop(op.get_bind())

    # Drop merchant_accounts table
    op.drop_index(op.f('ix_merchant_accounts_user_id'), table_name='merchant_accounts')
    op.drop_table('merchant_accounts')

    # Drop enum for merchant_accounts
    sa.Enum('unverified', 'verified', 'suspended', 'rejected', name='merchantverificationstatus').drop(op.get_bind())
