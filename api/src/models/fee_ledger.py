import enum
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class FeeLedgerStatus(str, enum.Enum):
    """
    Status of a fee ledger entry.

    created:    Fee split recorded, waiting for provider earnings creation
    allocated:  Platform fee and provider share allocated
    settled:    All money movements (treasury + earnings) confirmed
    """
    created = "created"
    allocated = "allocated"
    settled = "settled"


class FeeLedger(Base):
    """
    Financial fee allocation ledger.

    SYSTEM TRUTH: This is the SPLIT LAYER that determines ownership.

    Design principle:
    - Every PaymentIntent gets exactly ONE FeeLedger
    - FeeLedger splits money into platform_fee + provider_amount
    - Platform fee goes to Global IT and Business Solutions (treasury)
    - Provider amount goes to EarningLedger (subject to trust + payout rules)

    This layer ensures:
    ✅ Money never disappears (total_amount = platform_fee + provider_amount)
    ✅ Clear platform economics (visible fee allocation)
    ✅ Audit trail (immutable split record)
    ✅ Future flexibility (dynamic fees by trust level)

    CRITICAL: FeeLedger ≠ EarningLedger ≠ PaymentIntent
    Each represents a different financial truth.
    """
    __tablename__ = "fee_ledgers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # Identity: which payment generated this split
    payment_intent_id = Column(UUID(as_uuid=True),
                              ForeignKey("payment_intents.id"),
                              nullable=False,
                              unique=True,
                              index=True)

    # Total & Split
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False, default="ZAR")

    # Fee Allocation (always sums to total_amount)
    platform_fee_percent = Column(Numeric(5, 2), nullable=False, default=10)  # Default 10%
    platform_fee_amount = Column(Numeric(12, 2), nullable=False)  # Calculated: total * platform_fee_percent / 100
    provider_amount = Column(Numeric(12, 2), nullable=False)  # Calculated: total - platform_fee

    # Platform Treasury Routing
    # Hard-coded to Global IT and Business Solutions in Phase 1
    # Future: upgrade to configurable org account system
    platform_account_name = Column(String,
                                  nullable=False,
                                  default="GLOBAL_IT_BUSINESS_SOLUTIONS",
                                  index=True)

    # Idempotency & Event Tracking (Ledger Safety Layer)
    # Prevents duplicate fee allocation from duplicate webhook processing
    idempotency_key = Column(String, nullable=True, unique=True, index=True)
    provider_event_id = Column(String, nullable=True, index=True)  # PayFast event reference

    # Lifecycle Status
    status = Column(String, nullable=False, default=FeeLedgerStatus.created)

    # Status Transitions
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    allocated_at = Column(DateTime(timezone=True), nullable=True)
    settled_at = Column(DateTime(timezone=True), nullable=True)

    # References to downstream entities created from this split
    earning_ledger_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Provider earnings record
    treasury_transaction_id = Column(UUID(as_uuid=True), nullable=True, index=True)  # Future: treasury ledger entry

    # Continuity Event Reference (audit trail)
    fee_allocation_continuity_event_id = Column(UUID(as_uuid=True), nullable=True)

    # Notes
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
