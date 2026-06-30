import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class EarningLedgerStatus(str, enum.Enum):
    """
    Status of an earnings entry through its lifecycle.

    pending:    Payment received, but not yet available for withdrawal
                (under review, trust validation in progress)

    available:  Payment verified, funds ready for withdrawal
                (can be included in payout batch)

    paid:       Funds included in processed payout batch
                (transferred to user's bank account)

    reversed:   Payment disputed/refunded
                (earnings clawed back, trust impact recorded)
    """
    pending = "pending"
    available = "available"
    paid = "paid"
    reversed = "reversed"


class EarningLedger(Base):
    """
    Financial ledger for tracking service provider earnings.

    SYSTEM TRUTH: This is the ONLY table that tracks what a user has earned.

    Design principle:
    - PaymentIntent = client's payment (inflow)
    - EarningLedger = provider's earnings (outflow)

    They are separate to enable:
    - Dispute handling (payment valid, but earnings reversed)
    - Trust-gated payouts (earned, but not yet payout-eligible)
    - Audit trails (immutable earnings history)

    Each EarningLedger entry links to exactly one PaymentIntent.
    """
    __tablename__ = "earning_ledgers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # Identity: who earned this
    user_id = Column(String, ForeignKey("profiles.user_id"), nullable=False, index=True)
    merchant_account_id = Column(UUID(as_uuid=True),
                                ForeignKey("merchant_accounts.id"),
                                nullable=False,
                                index=True)

    # Payment Truth: which payment generated this earning
    payment_intent_id = Column(UUID(as_uuid=True),
                              ForeignKey("payment_intents.id"),
                              nullable=False,
                              unique=True,
                              index=True)

    # Opportunity Context: what work was this for
    opportunity_id = Column(String, ForeignKey("opportunities.id"), nullable=True, index=True)

    # Financial Data
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False, default="ZAR")

    # Lifecycle Status
    status = Column(Enum(EarningLedgerStatus),
                   nullable=False,
                   default=EarningLedgerStatus.pending)

    # Status Transitions (audit trail)
    pending_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    available_at = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    reversed_at = Column(DateTime(timezone=True), nullable=True)

    # Payout Batch Reference (if paid)
    payout_batch_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    payout_request_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Reversal Information (if reversed)
    reversal_reason = Column(String, nullable=True)
    reversal_triggered_by = Column(String, nullable=True)  # dispute_id, admin_id, etc.
    reversal_notes = Column(Text, nullable=True)

    # Continuity Event References (for audit)
    created_continuity_event_id = Column(UUID(as_uuid=True), nullable=True)
    status_change_continuity_event_id = Column(UUID(as_uuid=True), nullable=True)

    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
