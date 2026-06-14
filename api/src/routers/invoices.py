from fastapi import APIRouter, Depends, HTTPException
import uuid
from uuid import UUID
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.invoice import Invoice, InvoiceStatus
from src.models.quote import Quote, QuoteStatus
from src.schemas.quote_to_cash_schema import InvoiceOut
from src.services.continuity_event_service import emit_continuity_event
from src.services.transition_audit_service import audit_transition
from src.services.verification_service import require_verified_steward
from src.models.profile import Profile


router = APIRouter(prefix="/api/v1/invoices", tags=["invoices"])


@router.post("/from-quote/{quote_id}", response_model=InvoiceOut)
def create_invoice_from_quote(quote_id: UUID, db: Session = Depends(get_db)):
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
        
    profile = db.query(Profile).filter(Profile.id == quote.business_owner_id).first()
    require_verified_steward(profile)

    if quote.status != QuoteStatus.accepted:
        raise HTTPException(status_code=409, detail="Only accepted quotes can become invoices")

    invoice_id = uuid.uuid4()
    try:
        audit_transition(
            db,
            business_owner_id=quote.business_owner_id,
            entity_type="Invoice",
            entity_id=str(invoice_id),
            current_state="draft",
            next_state="issued",
            actor_type="business_owner",
            actor_id=quote.business_owner_id
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    invoice = Invoice(
        id=invoice_id,
        business_owner_id=quote.business_owner_id,
        quote_id=quote.id,
        amount=quote.amount,
        currency=quote.currency,
        status=InvoiceStatus.issued,
    )
    with replay_transaction(db):
        event = emit_continuity_event(
            db,
            business_owner_id=invoice.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="invoice_created",
            actor_type="business_owner",
            actor_id=invoice.business_owner_id,
            related_entity_type="invoice",
            related_entity_id=str(invoice.id),
            parent_event_id=quote.accepted_continuity_event_id,
            payload={
                "quote_id": str(quote.id),
                "amount": str(invoice.amount),
                "currency": invoice.currency,
            },
            auto_commit=False,
        )
        invoice.continuity_event_id = event.id
        db.add(invoice)
        db.flush()
        db.refresh(invoice)
    return invoice
