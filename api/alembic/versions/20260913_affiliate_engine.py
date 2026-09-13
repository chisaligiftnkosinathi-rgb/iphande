"""add_affiliate_offers_and_leads
Revision ID: 20260913_affiliate_engine
Revises: 20260913_purge_faith
Create Date: 2026-09-13 18:45:00.000000

Adds affiliate_offers and affiliate_leads tables for auxiliary merchant revenue.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260913_affiliate_engine"
down_revision: Union[str, Sequence[str], None] = "20260913_purge_faith"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create affiliate_offers
    op.create_table(
        "affiliate_offers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("category", sa.String(60), nullable=False),
        sa.Column("client_name", sa.String(100), nullable=False),
        sa.Column("channel", sa.String(100), server_default="Web", nullable=True),
        sa.Column("payout_model", sa.String(30), server_default="CPA", nullable=False),
        sa.Column("base_payout", sa.Numeric(10, 2), server_default="0.00", nullable=False),
        sa.Column("payout_percentage", sa.Numeric(5, 4), nullable=True),
        sa.Column("payout_tier_rules", sa.JSON(), nullable=True),
        sa.Column("merchant_split_ratio", sa.Numeric(4, 2), server_default="0.70", nullable=False),
        sa.Column("min_income", sa.Numeric(10, 2), nullable=True),
        sa.Column("min_age", sa.Integer(), server_default="18", nullable=False),
        sa.Column("max_age", sa.Integer(), server_default="65", nullable=False),
        sa.Column("requires_employment", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("requires_bank_account", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("requires_sa_citizen", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("requires_driver_license", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("dedup_period_days", sa.Integer(), server_default="90", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_affiliate_offers_slug", "affiliate_offers", ["slug"], unique=True)
    op.create_index("ix_affiliate_offers_category", "affiliate_offers", ["category"])

    # 2. Create affiliate_leads
    op.create_table(
        "affiliate_leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("offer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("affiliate_offers.id"), nullable=False),
        sa.Column("merchant_id", sa.String(100), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("phone_number", sa.String(30), nullable=False),
        sa.Column("email", sa.String(150), nullable=True),
        sa.Column("national_id", sa.String(30), nullable=True),
        sa.Column("monthly_income", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_employed", sa.Boolean(), nullable=True),
        sa.Column("has_bank_account", sa.Boolean(), nullable=True),
        sa.Column("is_sa_citizen", sa.Boolean(), nullable=True),
        sa.Column("has_driver_license", sa.Boolean(), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(30), server_default="SUBMITTED", nullable=False),
        sa.Column("disqualification_reason", sa.String(255), nullable=True),
        sa.Column("external_lead_id", sa.String(100), nullable=True),
        sa.Column("customer_metadata", sa.JSON(), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("gross_commission", sa.Numeric(10, 2), nullable=True),
        sa.Column("merchant_commission", sa.Numeric(10, 2), nullable=True),
        sa.Column("platform_fee", sa.Numeric(10, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_affiliate_leads_offer_id", "affiliate_leads", ["offer_id"])
    op.create_index("ix_affiliate_leads_merchant_id", "affiliate_leads", ["merchant_id"])
    op.create_index("ix_affiliate_leads_phone_number", "affiliate_leads", ["phone_number"])
    op.create_index("ix_affiliate_leads_national_id", "affiliate_leads", ["national_id"])
    op.create_index("ix_affiliate_leads_status", "affiliate_leads", ["status"])
    op.create_index("ix_affiliate_leads_offer_phone", "affiliate_leads", ["offer_id", "phone_number"])
    op.create_index("ix_affiliate_leads_offer_national_id", "affiliate_leads", ["offer_id", "national_id"])


def downgrade() -> None:
    op.drop_table("affiliate_leads")
    op.drop_table("affiliate_offers")
