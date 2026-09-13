"""add_lead_fica_documents_and_popia_consent
Revision ID: 20260913_lead_documents_popia
Revises: 20260913_affiliate_tools
Create Date: 2026-09-13 19:35:00.000000

Creates lead_fica_documents and popia_consent_logs tables.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260913_lead_documents_popia"
down_revision: Union[str, Sequence[str], None] = "20260913_affiliate_tools"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create lead_fica_documents
    op.create_table(
        "lead_fica_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("affiliate_leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(50), nullable=False),
        sa.Column("storage_bucket", sa.String(100), nullable=False),
        sa.Column("storage_key", sa.String(255), nullable=False),
        sa.Column("file_mime_type", sa.String(50), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False),
        sa.Column("kms_key_id", sa.String(255), nullable=True),
        sa.Column("sha256_checksum", sa.String(64), nullable=True),
        sa.Column("verification_status", sa.String(30), server_default="PENDING", nullable=False),
        sa.Column("rejection_reason", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("purged_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_lead_fica_documents_lead_id", "lead_fica_documents", ["lead_id"])
    op.create_index("ix_lead_fica_documents_verification_status", "lead_fica_documents", ["verification_status"])

    # 2. Create popia_consent_logs
    op.create_table(
        "popia_consent_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("affiliate_leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("id_number", sa.String(13), nullable=False),
        sa.Column("ip_address", sa.String(45), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=False),
        sa.Column("consented_to_credit_check", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("consented_to_dealership_sharing", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("consented_to_affiliate_forwarding", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("consent_version", sa.String(20), server_default="POPIA-v1.0-2026", nullable=False),
        sa.Column("raw_consent_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_popia_consent_logs_lead_id", "popia_consent_logs", ["lead_id"])
    op.create_index("ix_popia_consent_logs_id_number", "popia_consent_logs", ["id_number"])


def downgrade() -> None:
    op.drop_table("popia_consent_logs")
    op.drop_table("lead_fica_documents")
