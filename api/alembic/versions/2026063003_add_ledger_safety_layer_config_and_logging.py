"""add_ledger_safety_layer_config_and_logging

Revision ID: 2026063003
Revises: 2026063002
Create Date: 2026-06-03 00:00:00.000000

Implements Ledger Safety Layer Phase 1:
- Idempotency fields added to payment_intent (previous migration)
- Idempotency fields added to fee_ledger (in this migration)
- Platform configuration table for dynamic fee rules
- Ledger immutability audit logging
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import func

# revision identifiers, used by Alembic.
revision = '2026063003'
down_revision = '2026063002'
branch_labels = None
depends_on = None


def upgrade():
    # Create enums
    config_scope_enum = postgresql.ENUM(
        'global_default',
        'trust_tier',
        'business_category',
        'promotional',
        name='config_scope'
    )
    config_scope_enum.create(op.get_bind(), checkfirst=True)

    # Add idempotency fields and indexes using batch mode for SQLite support
    with op.batch_alter_table('fee_ledgers') as batch_op:
        batch_op.add_column(sa.Column('idempotency_key', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('provider_event_id', sa.String(), nullable=True))
        batch_op.create_unique_constraint('uq_fee_ledgers_idempotency_key', ['idempotency_key'])
        batch_op.create_index('ix_fee_ledgers_idempotency_key', ['idempotency_key'])
        batch_op.create_index('ix_fee_ledgers_provider_event_id', ['provider_event_id'])

    # Create platform_configs table
    op.create_table(
        'platform_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('scope', postgresql.ENUM(
            'global_default',
            'trust_tier',
            'business_category',
            'promotional',
            name='config_scope',
            create_type=False
        ), nullable=False),
        sa.Column('trust_tier', sa.String(), nullable=True),
        sa.Column('business_category', sa.String(), nullable=True),
        sa.Column('campaign_id', sa.String(), nullable=True),
        sa.Column('value_type', sa.String(), nullable=False, server_default='decimal'),
        sa.Column('decimal_value', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('integer_value', sa.String(), nullable=True),
        sa.Column('string_value', sa.String(), nullable=True),
        sa.Column('boolean_value', sa.Boolean(), nullable=True),
        sa.Column('json_value', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='True'),
        sa.Column('effective_from', sa.DateTime(timezone=True), nullable=True),
        sa.Column('effective_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('changed_by', sa.String(), nullable=True),
        sa.Column('change_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_platform_configs_key', 'platform_configs', ['key'])
    op.create_index('ix_platform_configs_scope', 'platform_configs', ['scope'])
    op.create_index('ix_platform_configs_trust_tier', 'platform_configs', ['trust_tier'])
    op.create_index('ix_platform_configs_business_category', 'platform_configs', ['business_category'])
    op.create_index('ix_platform_configs_campaign_id', 'platform_configs', ['campaign_id'])

    # Create ledger_immutability_logs table
    op.create_table(
        'ledger_immutability_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ledger_type', sa.String(), nullable=False),
        sa.Column('ledger_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('triggered_by', sa.String(), nullable=True),
        sa.Column('attempted_change', sa.Text(), nullable=True),
        sa.Column('block_reason', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ledger_immutability_logs_ledger_type', 'ledger_immutability_logs', ['ledger_type'])
    op.create_index('ix_ledger_immutability_logs_ledger_id', 'ledger_immutability_logs', ['ledger_id'])

    # Insert default global platform fee
    import uuid
    from datetime import datetime

    op.execute(
        sa.text("""
            INSERT INTO platform_configs (
                id, key, scope, value_type, decimal_value, is_active,
                effective_from, changed_by, change_reason, created_at, updated_at
            ) VALUES (
                :id,
                'platform_fee_percent',
                'global_default',
                'decimal',
                10,
                TRUE,
                :now,
                'system',
                'Initial default configuration',
                :now,
                :now
            )
        """).bindparams(
            id=str(uuid.uuid4()).replace('-', ''),
            now=datetime.utcnow()
        )
    )


def downgrade():
    # Drop tables
    op.drop_table('ledger_immutability_logs')
    op.drop_table('platform_configs')

    # Drop idempotency fields from fee_ledger
    op.drop_constraint('uq_fee_ledgers_idempotency_key', 'fee_ledgers', type_='unique')
    op.drop_index('ix_fee_ledgers_idempotency_key', table_name='fee_ledgers')
    op.drop_index('ix_fee_ledgers_provider_event_id', table_name='fee_ledgers')
    op.drop_column('fee_ledgers', 'provider_event_id')
    op.drop_column('fee_ledgers', 'idempotency_key')

    # Drop enum
    postgresql.ENUM('config_scope').drop(op.get_bind())
