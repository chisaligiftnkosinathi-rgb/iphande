import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.financial_event import (
    AccountingCategory,
    CashDirection,
    FinancialEvent,
    FinancialEventType,
)
from src.models.invoice import Invoice, InvoiceStatus
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.models.quote import Quote
from src.schemas.quote_to_cash_schema import PaymentIntentCreate, PaymentIntentOut
from src.services.continuity_event_service import emit_continuity_event
from src.services.transition_audit_service import audit_transition


router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.post("/intents", response_model=PaymentIntentOut)
def create_payment_intent(payload: PaymentIntentCreate, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status != InvoiceStatus.issued:
        raise HTTPException(status_code=409, detail="Payment intents require an issued invoice")

    payment_id = uuid.uuid4()
    payment = PaymentIntent(
        id=payment_id,
        business_owner_id=invoice.business_owner_id,
        invoice_id=invoice.id,
        quote_id=invoice.quote_id,
        provider_name=payload.provider_name,
        payment_reference=f"demo-{uuid.uuid4()}",
        payer_reference=payload.payer_reference,
        amount=invoice.amount,
        currency=invoice.currency,
        status=PaymentIntentStatus.pending,
    )

    try:
        audit_transition(
            db,
            business_owner_id=invoice.business_owner_id,
            entity_type="PaymentIntent",
            entity_id=str(payment_id),
            current_state="created",
            next_state="pending",
            actor_type="system",
            actor_id=payload.provider_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

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
            parent_event_id=invoice.continuity_event_id,
            payload={
                "invoice_id": str(invoice.id),
                "provider_name": payment.provider_name,
                "payment_reference": payment.payment_reference,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "demo_only": True,
            },
            auto_commit=False,
        )
        payment.continuity_event_id = event.id
        db.add(payment)
        db.flush()
        db.refresh(payment)
    return payment


@router.post("/{payment_id}/confirm-demo", response_model=PaymentIntentOut)
def confirm_demo_payment(payment_id: UUID, db: Session = Depends(get_db)):
    payment = db.query(PaymentIntent).filter(PaymentIntent.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if payment.status != PaymentIntentStatus.pending:
        raise HTTPException(status_code=409, detail="Only pending payment intents can be demo-confirmed")

    invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
    quote = db.query(Quote).filter(Quote.id == payment.quote_id).first()
    if not invoice or not quote:
        raise HTTPException(status_code=409, detail="Payment intent is missing quote or invoice lineage")

    financial_event_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    current_payment_state = payment.status.value if hasattr(payment.status, "value") else payment.status
    current_invoice_state = invoice.status.value if hasattr(invoice.status, "value") else invoice.status

    try:
        audit_transition(
            db,
            business_owner_id=payment.business_owner_id,
            entity_type="PaymentIntent",
            entity_id=str(payment.id),
            current_state=current_payment_state,
            next_state="confirmed",
            actor_type="payment_provider",
            actor_id=payment.provider_name,
        )
        audit_transition(
            db,
            business_owner_id=invoice.business_owner_id,
            entity_type="Invoice",
            entity_id=str(invoice.id),
            current_state=current_invoice_state,
            next_state="paid",
            actor_type="system",
            actor_id="quote_to_cash",
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    with replay_transaction(db):
        payment.status = PaymentIntentStatus.confirmed
        payment.confirmed_at = now
        invoice.status = InvoiceStatus.paid
        invoice.paid_at = now
        payment_event = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="payment_confirmed",
            actor_type="payment_provider",
            actor_id=payment.provider_name,
            related_entity_type="payment_intent",
            related_entity_id=str(payment.id),
            parent_event_id=payment.continuity_event_id,
            payload={
                "invoice_id": str(invoice.id),
                "quote_id": str(quote.id),
                "payment_reference": payment.payment_reference,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "demo_only": True,
            },
            auto_commit=False,
        )
        financial_event_continuity = emit_continuity_event(
            db,
            business_owner_id=payment.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type=FinancialEventType.income_received.value,
            actor_type="system",
            actor_id="quote_to_cash",
            related_entity_type="financial_event",
            related_entity_id=str(financial_event_id),
            parent_event_id=payment_event.id,
            payload={
                "invoice_id": str(invoice.id),
                "quote_id": str(quote.id),
                "payment_intent_id": str(payment.id),
                "amount": str(payment.amount),
                "currency": payment.currency,
                "cash_direction": CashDirection.inflow.value,
                "accounting_category": AccountingCategory.income.value,
                "demo_only": True,
            },
            auto_commit=False,
        )
        financial_event = FinancialEvent(
            id=financial_event_id,
            business_owner_id=payment.business_owner_id,
            event_type=FinancialEventType.income_received,
            amount=payment.amount,
            currency=payment.currency,
            description=f"Demo payment received for invoice {invoice.id}",
            occurred_at=now,
            accounting_category=AccountingCategory.income,
            cash_direction=CashDirection.inflow,
            source_actor="payment_provider",
            counterparty=quote.customer_name,
            creates_obligation=False,
            continuity_event_id=financial_event_continuity.id,
        )
        db.add(financial_event)
        payment.confirmed_continuity_event_id = payment_event.id
        payment.financial_event_id = financial_event.id
        invoice.paid_continuity_event_id = payment_event.id
        db.flush()
        db.refresh(payment)
    return payment
