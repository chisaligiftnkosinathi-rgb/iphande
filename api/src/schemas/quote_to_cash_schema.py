from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from src.models.invoice import InvoiceStatus
from src.models.payment_intent import PaymentIntentStatus
from src.models.quote import QuoteStatus


class QuoteCreate(BaseModel):
    business_owner_id: str
    customer_request_id: str | None = None
    customer_name: str
    customer_phone: str | None = None
    description: str
    amount: Decimal = Field(gt=0)
    currency: str = "ZAR"


class QuoteOut(BaseModel):
    id: UUID
    business_owner_id: str
    customer_request_id: str | None = None
    customer_name: str
    customer_phone: str | None = None
    description: str
    amount: Decimal
    currency: str
    status: QuoteStatus
    continuity_event_id: UUID
    accepted_continuity_event_id: UUID | None = None
    created_at: datetime
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


class PaymentIntentOut(BaseModel):
    id: UUID
    business_owner_id: str
    invoice_id: UUID
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
    created_at: datetime
    confirmed_at: datetime | None = None

    model_config = {"from_attributes": True}
