from datetime import datetime, timezone
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.quote import Quote, QuoteStatus
from src.schemas.quote_to_cash_schema import QuoteCreate, QuoteOut
from src.services.continuity_event_service import emit_continuity_event
from src.services.transition_audit_service import audit_transition


router = APIRouter(prefix="/api/v1/quotes", tags=["quotes"])


@router.post("", response_model=QuoteOut)
def create_quote(payload: QuoteCreate, db: Session = Depends(get_db)):
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
    )
    with replay_transaction(db):
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
    return (
        db.query(Quote)
        .filter(Quote.business_owner_id == business_owner_id)
        .order_by(Quote.created_at.asc())
        .all()
    )


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
