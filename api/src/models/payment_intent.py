import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class PaymentIntentStatus(str, enum.Enum):
    evidence_awaiting = "evidence_awaiting"
    evidence_submitted = "evidence_submitted"
    under_review = "under_review"
    verified = "verified"
    rejected = "rejected"
    pending = "pending"
    confirmed = "confirmed"
    failed = "failed"


class PaymentIntent(Base):
    __tablename__ = "payment_intents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    business_owner_id = Column(String, nullable=False, index=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quotes.id"), nullable=True)
    opportunity_id = Column(String, ForeignKey("opportunities.id"), nullable=True)
    provider_name = Column(String, nullable=False, default="demo")
    payment_reference = Column(String, nullable=False, unique=True)
    payer_reference = Column(String, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, nullable=False, default="ZAR")
    status = Column(Enum(PaymentIntentStatus), nullable=False, default=PaymentIntentStatus.pending)
    continuity_event_id = Column(UUID(as_uuid=True), nullable=False)
    confirmed_continuity_event_id = Column(UUID(as_uuid=True), nullable=True)
    financial_event_id = Column(UUID(as_uuid=True), nullable=True)
    receipt_number = Column(String, nullable=True)
    receipt_continuity_event_id = Column(UUID(as_uuid=True), nullable=True)

    # Idempotency & Event Tracking (Ledger Safety Layer)
    # Prevents duplicate webhook processing (critical for PayFast ITN safety)
    idempotency_key = Column(String, nullable=True, unique=True, index=True)
    provider_event_id = Column(String, nullable=True, index=True)  # PayFast event reference
    ledger_processed_at = Column(DateTime(timezone=True), nullable=True)  # When payment → ledger conversion happened

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)


class ProofOfPaymentStatus(str, enum.Enum):
    submitted = "submitted"
    evidence_check_passed = "evidence_check_passed"
    evidence_check_failed = "evidence_check_failed"


class ProofOfPayment(Base):
    __tablename__ = "proofs_of_payment"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    payment_intent_id = Column(UUID(as_uuid=True), ForeignKey("payment_intents.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)
    evidence_status = Column(Enum(ProofOfPaymentStatus), nullable=False, default=ProofOfPaymentStatus.submitted)
    extracted_amount = Column(Numeric(12, 2), nullable=True)
    extracted_reference = Column(String, nullable=True)
    payer_name = Column(String, nullable=True)
    account_info_present = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    continuity_event_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
