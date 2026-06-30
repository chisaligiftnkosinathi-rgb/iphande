import hashlib
import uuid
from decimal import Decimal, InvalidOperation
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.core.payment_config import payment_config
from src.database import get_db, replay_transaction
from src.models.invoice import Invoice, InvoiceStatus
from src.models.opportunity import Opportunity
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.models.quote import Quote
from src.models.continuity_event_model import ContinuityEvent
from src.services.continuity_event_service import emit_continuity_event


class PayfastCreatePayload(BaseModel):
    opportunity_id: Optional[str] = None
    quote_id: Optional[uuid.UUID] = None
    invoice_id: Optional[uuid.UUID] = None
    payer_profile_id: Optional[str] = None
    payer_reference: Optional[str] = None


class PayfastCreateResponse(BaseModel):
    payment_url: str
    payment_data: dict
    payment_intent_id: str


router = APIRouter(prefix="/payments/payfast", tags=["payfast"])


def _ensure_payfast_config():
    missing = []
    if not payment_config.PAYFAST_MERCHANT_ID:
        missing.append("PAYFAST_MERCHANT_ID")
    if not payment_config.PAYFAST_MERCHANT_KEY:
        missing.append("PAYFAST_MERCHANT_KEY")
    if not payment_config.PAYFAST_RETURN_URL:
        missing.append("PAYFAST_RETURN_URL")
    if not payment_config.PAYFAST_CANCEL_URL:
        missing.append("PAYFAST_CANCEL_URL")
    if not payment_config.PAYFAST_NOTIFY_URL:
        missing.append("PAYFAST_NOTIFY_URL")
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"PayFast configuration incomplete: {', '.join(missing)}",
        )


def _payfast_signature(payload: dict[str, str]) -> str:
    payload_items = sorted(
        (key, str(value))
        for key, value in payload.items()
        if key != "signature" and value is not None and str(value) != ""
    )
    signed_string = "&".join(f"{key}={value}" for key, value in payload_items)
    signed_string += f"&merchant_key={payment_config.PAYFAST_MERCHANT_KEY}"
    return hashlib.md5(signed_string.encode("utf-8")).hexdigest()


def _latest_payment_event(db: Session, payment_id: uuid.UUID):
    return (
        db.query(ContinuityEvent)
        .filter(
            ContinuityEvent.related_entity_type == "payment_intent",
            ContinuityEvent.related_entity_id == str(payment_id),
        )
        .order_by(ContinuityEvent.lineage_sequence.desc())
        .first()
    )


@router.post("/create", response_model=PayfastCreateResponse)
def create_payfast_payment(payload: PayfastCreatePayload, db: Session = Depends(get_db)):
    _ensure_payfast_config()

    business_owner_id = None
    amount = None
    currency = "ZAR"
    quote_id = None
    opportunity_id = None
    item_name = "iPhande Opportunity Payment"

    if payload.quote_id:
        quote = db.query(Quote).filter(Quote.id == payload.quote_id).first()
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        business_owner_id = quote.business_owner_id
        amount = quote.amount
        currency = quote.currency
        quote_id = quote.id
        item_name = quote.description or quote.customer_name or "iPhande Quote"
    elif payload.invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        business_owner_id = invoice.business_owner_id
        amount = invoice.amount
        currency = invoice.currency
        quote_id = invoice.quote_id
        item_name = f"Invoice {invoice.id}"
    elif payload.opportunity_id:
        opportunity = db.query(Opportunity).filter(Opportunity.id == payload.opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        if not opportunity.budget_amount:
            raise HTTPException(status_code=400, detail="Opportunity does not have a budget amount for payment")
        try:
            amount = Decimal(str(opportunity.budget_amount))
        except InvalidOperation:
            raise HTTPException(status_code=400, detail="Opportunity budget amount is invalid")
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")
        business_owner_id = opportunity.created_by_profile_id
        opportunity_id = opportunity.id
        item_name = opportunity.title
    else:
        raise HTTPException(status_code=400, detail="Must provide quote_id, invoice_id, or opportunity_id")

    payment_id = uuid.uuid4()
    payment = PaymentIntent(
        id=payment_id,
        business_owner_id=business_owner_id,
        quote_id=quote_id,
        opportunity_id=opportunity_id,
        provider_name="payfast",
        payment_reference=f"payfast-{uuid.uuid4()}",
        payer_reference=payload.payer_reference,
        amount=amount,
        currency=currency,
        status=PaymentIntentStatus.pending,
    )

    with replay_transaction(db):
        event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_intent_created",
            actor_type="system",
            actor_id=payment.provider_name,
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=None,
            payload={
                "opportunity_id": opportunity_id,
                "quote_id": str(quote_id) if quote_id else None,
                "payment_intent_id": str(payment.id),
                "payment_reference": payment.payment_reference,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "provider_name": payment.provider_name,
                "next_status": PaymentIntentStatus.pending.value,
            },
            auto_commit=False,
        )
        payment.continuity_event_id = event.id
        db.add(payment)
        db.flush()
        db.refresh(payment)

    payment_data = {
        "merchant_id": payment_config.PAYFAST_MERCHANT_ID,
        "merchant_key": payment_config.PAYFAST_MERCHANT_KEY,
        "return_url": payment_config.PAYFAST_RETURN_URL,
        "cancel_url": payment_config.PAYFAST_CANCEL_URL,
        "notify_url": payment_config.PAYFAST_NOTIFY_URL,
        "m_payment_id": str(payment.id),
        "amount": str(payment.amount),
        "item_name": item_name,
        "item_description": item_name,
    }
    payment_data["signature"] = _payfast_signature(payment_data)

    return {
        "payment_url": payment_config.PAYFAST_BASE_URL,
        "payment_data": payment_data,
        "payment_intent_id": str(payment.id),
    }


@router.post("/notify")
async def payfast_notify(request: Request, db: Session = Depends(get_db)):
    """
    PayFast ITN (Instant Transaction Notification) webhook handler.

    CRITICAL: Idempotency check is FIRST line of business logic.
    PayFast sends duplicate ITN notifications; this handler must be safe
    against replay attacks.

    Flow:
    1. Parse & validate PayFast signature
    2. Check provider_event_id (pf_payment_id) for duplicates (MANDATORY)
    3. If duplicate: return HTTP 200 OK (idempotent, safe)
    4. If new: proceed with atomic transaction
    """
    _ensure_payfast_config()
    form = await request.form()
    data = {key: str(value) for key, value in form.items()}

    # ===== STEP 1: Validate PayFast signature =====
    signature = data.get("signature")
    merchant_id = data.get("merchant_id")
    payment_status = data.get("payment_status")
    m_payment_id = data.get("m_payment_id")
    pf_payment_id = data.get("pf_payment_id")
    amount_gross = data.get("amount_gross")

    if not signature:
        raise HTTPException(status_code=400, detail="Missing PayFast signature")
    if merchant_id != payment_config.PAYFAST_MERCHANT_ID:
        raise HTTPException(status_code=400, detail="Invalid PayFast merchant_id")
    if not payment_status or payment_status.upper() != "COMPLETE":
        raise HTTPException(status_code=400, detail="PayFast payment not complete")
    if not m_payment_id:
        raise HTTPException(status_code=400, detail="Missing PayFast payment ID")
    if not amount_gross:
        raise HTTPException(status_code=400, detail="Missing PayFast amount_gross")

    expected = _payfast_signature(data)
    if signature != expected:
        raise HTTPException(status_code=400, detail="Invalid PayFast signature")

    # ===== STEP 2: Validate payment_intent exists =====
    try:
        payment_id = uuid.UUID(m_payment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid PayFast payment ID")

    payment = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment intent not found")

    try:
        gross_value = Decimal(amount_gross)
    except InvalidOperation:
        raise HTTPException(status_code=400, detail="Invalid PayFast amount")

    if gross_value != payment.amount:
        raise HTTPException(status_code=400, detail="PayFast amount mismatch")

    # ===== STEP 3: IDEMPOTENCY CHECK (MUST BE BEFORE ANY PROCESSING) =====
    # Check if this pf_payment_id (provider_event_id) has already been processed
    if pf_payment_id:
        existing_payment = db.query(PaymentIntent).filter(
            PaymentIntent.provider_event_id == pf_payment_id,
            PaymentIntent.id != payment_id
        ).first()

        if existing_payment:
            # Different payment with same pf_payment_id = impossible, PayFast error
            raise HTTPException(status_code=400, detail="Duplicate pf_payment_id for different payment")

        # Check if THIS payment has already been processed with this pf_payment_id
        if payment.provider_event_id == pf_payment_id:
            # DUPLICATE WEBHOOK: Already processed this exact pf_payment_id
            # Return 200 OK (idempotent response) - do NOT process again
            # This is how we prevent PayFast retries from double-crediting
            return {
                "status": "ok",
                "payment_intent_id": str(payment.id),
                "duplicate_webhook": True,
                "message": "This webhook was already processed"
            }

    # ===== STEP 4: PROCESS PAYMENT (only if not already processed) =====
    # At this point, we know:
    # - Signature is valid
    # - Payment exists and amount matches
    # - This is NOT a duplicate webhook

    if payment.status == PaymentIntentStatus.confirmed:
        # Payment already confirmed (shouldn't happen if idempotency key is set)
        return {
            "status": "ok",
            "payment_intent_id": str(payment.id),
            "message": "Payment already confirmed"
        }

    latest_event = _latest_payment_event(db, payment.id)

    with replay_transaction(db):
        # Set provider_event_id to prevent future duplicates
        payment.provider_event_id = pf_payment_id
        payment.status = PaymentIntentStatus.confirmed
        payment.confirmed_at = payment.confirmed_at or None
        payment.payer_reference = pf_payment_id or payment.payer_reference

        event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_received",
            actor_type="system",
            actor_id="payfast",
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=latest_event.id if latest_event else payment.continuity_event_id,
            payload={
                "payment_intent_id": str(payment.id),
                "pf_payment_id": pf_payment_id,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "payment_status": payment_status,
            },
            auto_commit=False,
        )
        payment.confirmed_continuity_event_id = event.id
        db.flush()
        db.refresh(payment)

    return {"status": "ok", "payment_intent_id": str(payment.id)}
