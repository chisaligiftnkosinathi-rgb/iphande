from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from src.models.invoice import InvoiceStatus
from src.models.payment_intent import PaymentIntentStatus, ProofOfPaymentStatus
from src.models.quote import QuoteStatus


class QuoteCreate(BaseModel):
    business_owner_id: str
    customer_request_id: str | None = None
    opportunity_id: str | None = None
    customer_name: str
    customer_phone: str | None = None
    description: str | None = None
    service_description: str | None = None
    amount: Decimal | None = None
    total: Decimal | None = None
    currency: str = "ZAR"
    terms: str | None = None

    # V2 fields
    subtotal: Decimal | None = None
    vat: Decimal | None = None
    line_items: list[dict[str, Any]] | None = None
    structured_terms: dict[str, Any] | list[dict[str, Any]] | None = None
    archetype_key: str | None = None
    business_line: str | None = None
    quote_template_version: str = "QUOTE_V2"

    @model_validator(mode='before')
    @classmethod
    def reconcile_v1_v2_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if 'amount' not in values and 'total' in values:
                values['amount'] = values['total']
            elif 'total' not in values and 'amount' in values:
                values['total'] = values['amount']

            if 'description' not in values and 'service_description' in values:
                values['description'] = values['service_description']
            elif 'service_description' not in values and 'description' in values:
                values['service_description'] = values['description']
        return values


class QuoteDraftFromRequestCreate(BaseModel):
    amount: Decimal | None = None
    total: Decimal | None = None
    currency: str = "ZAR"
    description: str | None = None
    service_description: str | None = None
    terms: str | None = None

    # V2 fields
    subtotal: Decimal | None = None
    vat: Decimal | None = None
    line_items: list[dict[str, Any]] | None = None
    structured_terms: dict[str, Any] | list[dict[str, Any]] | None = None
    archetype_key: str | None = None
    business_line: str | None = None
    quote_template_version: str = "QUOTE_V2"

    @model_validator(mode='before')
    @classmethod
    def reconcile_v1_v2_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if 'amount' not in values and 'total' in values:
                values['amount'] = values['total']
            elif 'total' not in values and 'amount' in values:
                values['total'] = values['amount']

            if 'description' not in values and 'service_description' in values:
                values['description'] = values['service_description']
            elif 'service_description' not in values and 'description' in values:
                values['service_description'] = values['description']
        return values


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

    # V2 fields
    subtotal: Decimal | None = None
    vat: Decimal | None = None
    line_items: list[dict[str, Any]] | None = None
    structured_terms: dict[str, Any] | list[dict[str, Any]] | None = None
    archetype_key: str | None = None
    business_line: str | None = None
    quote_template_version: str

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


class PaymentIntentReviewOut(BaseModel):
    payment_intent_id: UUID
    quote_id: UUID
    quote_request_id: str | None = None
    business_owner_id: str
    customer_name: str | None = None
    amount: Decimal
    currency: str
    status: PaymentIntentStatus
    payment_reference: str
    receipt_number: str | None = None
    latest_proof_file_name: str | None = None
    evidence_status: ProofOfPaymentStatus | None = None
    evidence_notes: str | None = None
    extracted_reference: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
