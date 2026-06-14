from datetime import datetime, timezone
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.quote import Quote, QuoteStatus
from src.models.payment_intent import PaymentIntent, PaymentIntentStatus
from src.models.opportunity import Opportunity
from src.schemas.quote_to_cash_schema import (
    PaymentIntentOut,
    QuoteCreate,
    QuoteOut,
    QuotePaymentIntentCreate,
)
from src.services.continuity_event_service import emit_continuity_event
from src.services.transition_audit_service import audit_transition
from src.services.verification_service import require_verified_steward
from src.models.profile import Profile


router = APIRouter(prefix="/api/v1/quotes", tags=["quotes"])


@router.post("", response_model=QuoteOut)
def create_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == payload.business_owner_id).first()
    require_verified_steward(profile)

    quote_id = uuid.uuid4()

    try:
        audit_transition(
            db,
            business_owner_id=payload.business_owner_id,
            entity_type="Quote",
            entity_id=str(quote_id),
            current_state="draft",
            next_state="issued",
            actor_type="business_owner",
            actor_id=payload.business_owner_id
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    quote = Quote(
        id=quote_id,
        business_owner_id=payload.business_owner_id,
        customer_request_id=payload.customer_request_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        description=payload.description,
        amount=payload.amount,
        currency=payload.currency,
        status=QuoteStatus.issued,
        subtotal=payload.subtotal,
        vat=payload.vat,
        line_items=payload.line_items,
        structured_terms=payload.structured_terms,
        archetype_key=payload.archetype_key,
        business_line=payload.business_line,
        quote_template_version=payload.quote_template_version,
    )
    
    with replay_transaction(db):
        if payload.opportunity_id:
            opp = db.query(Opportunity).filter(Opportunity.id == payload.opportunity_id).first()
            if opp:
                opp.status = "quoted"
                emit_continuity_event(
                    db,
                    business_owner_id=opp.created_by_profile_id,
                    business_category_key=opp.category_key,
                    business_line=opp.service_needed,
                    event_type="opportunity_quoted",
                    actor_type="business_owner",
                    actor_id=opp.created_by_profile_id,
                    related_entity_type="opportunity",
                    related_entity_id=str(opp.id),
                    payload={
                        "quote_id": str(quote.id),
                        "summary_available": True,
                    },
                    auto_commit=False
                )

        event = emit_continuity_event(
            db,
            business_owner_id=quote.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="quote_issued",
            actor_type="business_owner",
            actor_id=quote.business_owner_id,
            related_entity_type="quote",
            related_entity_id=str(quote.id),
            payload={
                "quote_template_version": quote.quote_template_version,
                "archetype_key": quote.archetype_key,
                "business_line": quote.business_line,
                "line_items": quote.line_items,
                "subtotal": str(quote.subtotal) if quote.subtotal is not None else None,
                "vat": str(quote.vat) if quote.vat is not None else None,
                "total": str(quote.amount),
                "service_description": quote.description,
                "structured_terms": quote.structured_terms,
                "amount": str(quote.amount),
                "currency": quote.currency,
                "customer_name": quote.customer_name,
                "description": quote.description,
            },
            auto_commit=False,
        )
        quote.continuity_event_id = event.id
        db.add(quote)
        db.flush()
        db.refresh(quote)
    return quote


@router.get("/business/{business_owner_id}", response_model=list[QuoteOut])
def list_quotes_for_business(business_owner_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == business_owner_id).first()
    require_verified_steward(profile)

    return (
        db.query(Quote)
        .filter(Quote.business_owner_id == business_owner_id)
        .order_by(Quote.created_at.asc())
        .all()
    )


@router.post("/{quote_id}/send", response_model=QuoteOut)
def send_quote(quote_id: UUID, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    allowed_statuses = {QuoteStatus.quote_drafted, QuoteStatus.issued}
    if quote.status not in allowed_statuses:
        raise HTTPException(status_code=409, detail="Only drafted quotes can be sent")

    with replay_transaction(db):
        previous_status = quote.status.value if hasattr(quote.status, "value") else quote.status
        quote.status = QuoteStatus.quote_sent
        quote.sent_at = datetime.now(timezone.utc)
        event = emit_continuity_event(
            db,
            business_owner_id=quote.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="quote_sent",
            actor_type="business_owner",
            actor_id=quote.business_owner_id,
            related_entity_type="quote",
            related_entity_id=str(quote.id),
            parent_event_id=quote.continuity_event_id,
            payload={
                "quote_request_id": quote.customer_request_id,
                "quote_id": str(quote.id),
                "previous_status": previous_status,
                "next_status": QuoteStatus.quote_sent.value,
                "amount": str(quote.amount),
                "currency": quote.currency,
                "service_description": quote.description,
            },
            auto_commit=False,
        )
        quote.sent_continuity_event_id = event.id
        db.flush()
        db.refresh(quote)
    return quote


@router.post("/{quote_id}/payment-intents", response_model=PaymentIntentOut)
def create_payment_intent_from_quote(
    quote_id: UUID,
    payload: QuotePaymentIntentCreate,
    db: Session = Depends(get_db),
):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.status != QuoteStatus.quote_sent:
        raise HTTPException(status_code=409, detail="Payment intent requires a sent quote")

    payment_id = uuid.uuid4()
    payment = PaymentIntent(
        id=payment_id,
        business_owner_id=quote.business_owner_id,
        invoice_id=None,
        quote_id=quote.id,
        provider_name=payload.provider_name,
        payment_reference=f"manual-{uuid.uuid4()}",
        payer_reference=payload.payer_reference,
        amount=quote.amount,
        currency=quote.currency,
        status=PaymentIntentStatus.evidence_awaiting,
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
            parent_event_id=quote.sent_continuity_event_id or quote.continuity_event_id,
            payload={
                "quote_request_id": quote.customer_request_id,
                "quote_id": str(quote.id),
                "payment_intent_id": str(payment.id),
                "payment_reference": payment.payment_reference,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "next_status": PaymentIntentStatus.evidence_awaiting.value,
            },
            auto_commit=False,
        )
        payment.continuity_event_id = event.id
        db.add(payment)
        db.flush()
        db.refresh(payment)
    return payment


@router.post("/{quote_id}/accept", response_model=QuoteOut)
def accept_quote(quote_id: UUID, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    if quote.status != QuoteStatus.issued:
        raise HTTPException(status_code=409, detail="Only issued quotes can be accepted")

    current_quote_state = quote.status.value if hasattr(quote.status, 'value') else quote.status
    try:
        audit_transition(
            db,
            business_owner_id=quote.business_owner_id,
            entity_type="Quote",
            entity_id=str(quote.id),
            current_state=current_quote_state,
            next_state="accepted",
            actor_type="customer",
            actor_id=quote.customer_phone or "unknown"
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    with replay_transaction(db):
        quote.status = QuoteStatus.accepted
        quote.accepted_at = datetime.now(timezone.utc)
        event = emit_continuity_event(
            db,
            business_owner_id=quote.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="quote_accepted",
            actor_type="customer",
            actor_id=quote.customer_phone,
            related_entity_type="quote",
            related_entity_id=str(quote.id),
            parent_event_id=quote.continuity_event_id,
            payload={
                "amount": str(quote.amount),
                "currency": quote.currency,
                "customer_name": quote.customer_name,
            },
            auto_commit=False,
        )
        quote.accepted_continuity_event_id = event.id
        db.flush()
        db.refresh(quote)
    return quote
