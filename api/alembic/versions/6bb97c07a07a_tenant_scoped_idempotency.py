"""tenant_scoped_idempotency

Revision ID: 6bb97c07a07a
Revises: a763f5689f23
Create Date: 2026-08-15 12:43:09.650048

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6bb97c07a07a'
down_revision: Union[str, Sequence[str], None] = 'a763f5689f23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # fee_ledgers
    with op.batch_alter_table('fee_ledgers', schema=None) as batch_op:
        batch_op.add_column(sa.Column('provider_user_id', sa.UUID(), nullable=True))
        # Drop global index on idempotency_key
        batch_op.drop_index(batch_op.f('ix_fee_ledgers_idempotency_key'))
        # Re-add as non-unique index
        batch_op.create_index(batch_op.f('ix_fee_ledgers_idempotency_key'), ['idempotency_key'], unique=False)
        batch_op.create_index(batch_op.f('ix_fee_ledgers_provider_user_id'), ['provider_user_id'], unique=False)
        # Create composite unique constraint
        batch_op.create_unique_constraint('uq_fee_ledger_idempotency', ['provider_user_id', 'idempotency_key'])

    # financial_events
    with op.batch_alter_table('financial_events', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_financial_event_idempotency', ['business_owner_id', 'idempotency_key'])

    # payment_intents
    with op.batch_alter_table('payment_intents', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_payment_intents_idempotency_key'))
        batch_op.create_index(batch_op.f('ix_payment_intents_idempotency_key'), ['idempotency_key'], unique=False)
        batch_op.create_unique_constraint('uq_payment_intent_idempotency', ['business_owner_id', 'idempotency_key'])
        batch_op.create_unique_constraint('uq_payment_intent_provider_event', ['business_owner_id', 'provider_event_id'])

    # treasury_ledgers
    with op.batch_alter_table('treasury_ledgers', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_treasury_ledgers_idempotency_key'))
        batch_op.create_index(batch_op.f('ix_treasury_ledgers_idempotency_key'), ['idempotency_key'], unique=False)


def downgrade() -> None:
    # treasury_ledgers
    with op.batch_alter_table('treasury_ledgers', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_treasury_ledgers_idempotency_key'))
        batch_op.create_index(batch_op.f('ix_treasury_ledgers_idempotency_key'), ['idempotency_key'], unique=True)

    # payment_intents
    with op.batch_alter_table('payment_intents', schema=None) as batch_op:
        batch_op.drop_constraint('uq_payment_intent_provider_event', type_='unique')
        batch_op.drop_constraint('uq_payment_intent_idempotency', type_='unique')
        batch_op.drop_index(batch_op.f('ix_payment_intents_idempotency_key'))
        batch_op.create_index(batch_op.f('ix_payment_intents_idempotency_key'), ['idempotency_key'], unique=True)

    # financial_events
    with op.batch_alter_table('financial_events', schema=None) as batch_op:
        batch_op.drop_constraint('uq_financial_event_idempotency', type_='unique')

    # fee_ledgers
    with op.batch_alter_table('fee_ledgers', schema=None) as batch_op:
        batch_op.drop_constraint('uq_fee_ledger_idempotency', type_='unique')
        batch_op.drop_index(batch_op.f('ix_fee_ledgers_provider_user_id'))
        batch_op.drop_index(batch_op.f('ix_fee_ledgers_idempotency_key'))
        batch_op.create_index(batch_op.f('ix_fee_ledgers_idempotency_key'), ['idempotency_key'], unique=True)
        batch_op.drop_column('provider_user_id')
