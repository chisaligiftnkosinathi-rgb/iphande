from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from src.models.invoice import InvoiceStatus
from src.models.payment_intent import PaymentIntentStatus, ProofOfPaymentStatus
from src.models.quote import QuoteStatus


class QuoteCreate(BaseModel):
    business_owner_id: str
    customer_request_id: str | None = None
    customer_name: str
    customer_phone: str | None = None
    description: str
    amount: Decimal = Field(gt=0)
    currency: str = "ZAR"
    terms: str | None = None


class QuoteDraftFromRequestCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = "ZAR"
    service_description: str | None = None
    terms: str | None = None


class QuoteOut(BaseModel):
    id: UUID
    business_owner_id: str
    customer_request_id: str | None = None
    customer_name: str
    customer_phone: str | None = None
    description: str
    amount: Decimal
    currency: str
    terms: str | None = None
    status: QuoteStatus
    continuity_event_id: UUID
    sent_continuity_event_id: UUID | None = None
    accepted_continuity_event_id: UUID | None = None
    created_at: datetime
    sent_at: datetime | None = None
    accepted_at: datetime | None = None

    model_config = {"from_attributes": True}


class InvoiceOut(BaseModel):
    id: UUID
    business_owner_id: str
    quote_id: UUID
    amount: Decimal
    currency: str
    status: InvoiceStatus
    continuity_event_id: UUID
    paid_continuity_event_id: UUID | None = None
    created_at: datetime
    paid_at: datetime | None = None

    model_config = {"from_attributes": True}


class PaymentIntentCreate(BaseModel):
    invoice_id: UUID
    provider_name: str = "demo"
    payer_reference: str | None = None


class QuotePaymentIntentCreate(BaseModel):
    provider_name: str = "manual_evidence"
    payer_reference: str | None = None


class PaymentIntentOut(BaseModel):
    id: UUID
    business_owner_id: str
    invoice_id: UUID | None = None
    quote_id: UUID
    provider_name: str
    payment_reference: str
    payer_reference: str | None = None
    amount: Decimal
    currency: str
    status: PaymentIntentStatus
    continuity_event_id: UUID
    confirmed_continuity_event_id: UUID | None = None
    financial_event_id: UUID | None = None
    receipt_number: str | None = None
    receipt_continuity_event_id: UUID | None = None
    created_at: datetime
    confirmed_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProofOfPaymentCreate(BaseModel):
    file_name: str
    file_type: str
    uploaded_by: str = "customer"
    extracted_amount: Decimal | None = None
    extracted_reference: str | None = None
    payer_name: str | None = None
    account_info_present: bool = False
    notes: str | None = None


class ProofOfPaymentOut(BaseModel):
    id: UUID
    payment_intent_id: UUID
    file_name: str
    file_type: str
    uploaded_by: str
    evidence_status: ProofOfPaymentStatus
    extracted_amount: Decimal | None = None
    extracted_reference: str | None = None
    payer_name: str | None = None
    account_info_present: str | None = None
    notes: str | None = None
    continuity_event_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
