"""add_affiliate_metadata_and_clicks
Revision ID: 20260913_affiliate_tools
Revises: 20260913_affiliate_engine
Create Date: 2026-09-13 19:05:00.000000

Adds affiliate_base_url, description, requires_fica to affiliate_offers,
and creates affiliate_clicks and affiliate_partner_statements tables.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260913_affiliate_tools"
down_revision: Union[str, Sequence[str], None] = "20260913_affiliate_engine"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add extra columns to affiliate_offers
    with op.batch_alter_table("affiliate_offers") as batch_op:
        batch_op.add_column(sa.Column("affiliate_base_url", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("requires_fica", sa.Boolean(), server_default=sa.text("false"), nullable=False))

    # 2. Create affiliate_clicks for tracking outbound referrals and sub_id attribution
    op.create_table(
        "affiliate_clicks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("offer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("affiliate_offers.id"), nullable=False),
        sa.Column("offer_slug", sa.String(80), nullable=False),
        sa.Column("merchant_id", sa.String(100), nullable=False),
        sa.Column("visitor_ip", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.String(255), nullable=True),
        sa.Column("target_url", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_affiliate_clicks_offer_id", "affiliate_clicks", ["offer_id"])
    op.create_index("ix_affiliate_clicks_offer_slug", "affiliate_clicks", ["offer_slug"])
    op.create_index("ix_affiliate_clicks_merchant_id", "affiliate_clicks", ["merchant_id"])

    # 3. Create affiliate_partner_statements for monthly reconciliation (e.g. HOSTAFRICA, EasyEquities batch reports)
    op.create_table(
        "affiliate_partner_statements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("partner", sa.String(80), nullable=False),  # e.g., HOSTAFRICA, EASYEQUITIES
        sa.Column("reporting_period", sa.String(20), nullable=False),  # e.g., 2026-09
        sa.Column("total_earnings", sa.Numeric(12, 2), nullable=False),
        sa.Column("withdrawn_amount", sa.Numeric(12, 2), server_default="0.00", nullable=False),
        sa.Column("total_visitors", sa.Integer(), server_default="0", nullable=False),
        sa.Column("new_signups", sa.Integer(), server_default="0", nullable=False),
        sa.Column("payout_account_id", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_affiliate_partner_statements_partner", "affiliate_partner_statements", ["partner"])
    op.create_index("ix_affiliate_partner_statements_period", "affiliate_partner_statements", ["partner", "reporting_period"], unique=True)


def downgrade() -> None:
    op.drop_table("affiliate_partner_statements")
    op.drop_table("affiliate_clicks")
    with op.batch_alter_table("affiliate_offers") as batch_op:
        batch_op.drop_column("requires_fica")
        batch_op.drop_column("description")
        batch_op.drop_column("affiliate_base_url")
