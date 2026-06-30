import enum
import uuid

from sqlalchemy import Column, DateTime, Numeric, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class TreasuryEntryType(str, enum.Enum):
    """Types of treasury entries"""
    platform_fee = "platform_fee"  # Platform fee from payment
    adjustment = "adjustment"  # Manual adjustment (rare)
    refund = "refund"  # Payment refund
    reversal = "reversal"  # Transaction reversal
    chargeback = "chargeback"  # Payment chargeback


class TreasuryLedgerStatus(str, enum.Enum):
    """Status of treasury ledger entry"""
    created = "created"  # Entry created, pending settlement
    allocated = "allocated"  # Allocated to revenue
    settled = "settled"  # Settled (transferred to account)
    reversed = "reversed"  # Reversed due to refund/chargeback


class TreasuryLedger(Base):
    """
    Platform treasury ledger.

    System truth: All platform revenue tracked here.
    Each successful payment produces exactly one TreasuryLedger entry
    for the platform's fee portion.

    This is separated from EarningLedger (provider earnings) to maintain
    clear accounting: money flows into TreasuryLedger for platform,
    separate EarningLedger for merchant payouts.

    Immutable after creation except for settlement metadata.
    """
    __tablename__ = "treasury_ledgers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # Financial Identity
    payment_intent_id = Column(UUID(as_uuid=True), ForeignKey("payment_intents.id"), nullable=False, unique=True, index=True)
    fee_ledger_id = Column(UUID(as_uuid=True), ForeignKey("fee_ledgers.id"), nullable=True, unique=True, index=True)

    # Amount & Currency (Immutable)
    amount = Column(Numeric(12, 2), nullable=False)  # Platform fee amount
    currency = Column(String, nullable=False, default="ZAR")

    # Entry Classification (Immutable)
    entry_type = Column(String, nullable=False, default=TreasuryEntryType.platform_fee)  # PLATFORM_FEE, ADJUSTMENT, REFUND, REVERSAL, CHARGEBACK

    # Owner (Immutable)
    # Hard-coded to Global IT and Business Solutions initially
    # Future: support multiple platform accounts via configuration
    owner = Column(String, nullable=False, default="GLOBAL_IT_BUSINESS_SOLUTIONS", index=True)

    # Lifecycle Status
    status = Column(String, nullable=False, default=TreasuryLedgerStatus.created)

    # Status Transitions
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    allocated_at = Column(DateTime(timezone=True), nullable=True)  # When allocated to revenue
    settled_at = Column(DateTime(timezone=True), nullable=True)  # When transferred to bank
    reversed_at = Column(DateTime(timezone=True), nullable=True)  # When reversed (refund/chargeback)

    # Settlement Details (Mutable for settlement)
    settlement_reference = Column(String, nullable=True)  # Bank transfer reference
    settlement_memo = Column(String, nullable=True)  # Settlement notes

    # Audit & Continuity
    continuity_event_id = Column(UUID(as_uuid=True), nullable=False)  # Immutable audit trail
    reversal_continuity_event_id = Column(UUID(as_uuid=True), nullable=True)  # Audit trail if reversed

    # Idempotency & Event Tracking (Ledger Safety Layer)
    # Prevents duplicate treasury entries from duplicate webhook processing
    idempotency_key = Column(String, nullable=True, unique=True, index=True)
    provider_event_id = Column(String, nullable=True, index=True)  # PayFast event reference
