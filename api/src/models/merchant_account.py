import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Boolean, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class MerchantVerificationStatus(str, enum.Enum):
    """Status of merchant account verification"""
    unverified = "unverified"
    verified = "verified"
    suspended = "suspended"
    rejected = "rejected"


class MerchantAccount(Base):
    """
    Merchant account for service providers to receive payouts.

    System truth: A user does NOT "receive money" directly.
    They receive an account binding that enables ledger credits.

    Each service provider must have exactly one active MerchantAccount
    to be payout-eligible.
    """
    __tablename__ = "merchant_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # Identity
    user_id = Column(String, ForeignKey("profiles.user_id"), nullable=False, unique=True, index=True)

    # Banking Details (South Africa)
    bank_name = Column(String, nullable=False)
    account_holder_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    branch_code = Column(String, nullable=False)
    account_type = Column(String, nullable=False, default="Cheque")  # Cheque, Savings, etc.

    # Verification & Eligibility
    verification_status = Column(Enum(MerchantVerificationStatus),
                                nullable=False,
                                default=MerchantVerificationStatus.unverified)
    verification_timestamp = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String, nullable=True)  # Admin user who verified

    # Payout Rules
    is_active = Column(Boolean, default=True, nullable=False)
    payout_enabled = Column(Boolean, default=False, nullable=False)
    minimum_balance_for_payout = Column(Numeric(12, 2), nullable=False, default=0)

    # Audit Trail
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspension_reason = Column(String, nullable=True)
