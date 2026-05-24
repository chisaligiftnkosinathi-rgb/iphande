from fastapi import APIRouter, HTTPException, Body, Depends
from sqlalchemy.orm import Session
from src.database import get_db

from src.models.quote_request_model import QuoteRequest, QuoteRequestStatus
from src.schemas.quote_request_schema import QuoteRequestCreate, QuoteRequestOut, QuoteRequestStatusUpdate
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter()




@router.post("/api/v1/quote-requests", response_model=QuoteRequestOut)
def create_quote_request(payload: QuoteRequestCreate, db: Session = Depends(get_db)):
    db_quote_request = QuoteRequest(**payload.dict())
    db.add(db_quote_request)
    db.commit()
    db.refresh(db_quote_request)

    print("EMITTING QUOTE REQUEST EVENT", db_quote_request.id)

    saved_event = emit_continuity_event(
        db,
        business_owner_id=db_quote_request.business_owner_id,
        business_category_key=db_quote_request.business_category_key,
        business_line=db_quote_request.business_line,
        event_type="quote_request_received",
        actor_type="customer",
        actor_id=db_quote_request.customer_phone,
        related_entity_type="quote_request",
        related_entity_id=str(db_quote_request.id),
        payload={
            "customer_name": db_quote_request.customer_name,
            "customer_phone": db_quote_request.customer_phone,
            "customer_location": db_quote_request.customer_location,
            "service_needed": db_quote_request.service_needed,
            "preferred_date": db_quote_request.preferred_date,
            "message": db_quote_request.message,
        },
    )

    print("SAVED QUOTE REQUEST EVENT", saved_event.id)

    return db_quote_request

@router.get("/api/v1/quote-requests", response_model=list[QuoteRequestOut])
def list_quote_requests(db: Session = Depends(get_db)):
    return db.query(QuoteRequest).all()

@router.get("/api/v1/quote-requests/{quote_request_id}", response_model=QuoteRequestOut)
def get_quote_request(quote_request_id: str, db: Session = Depends(get_db)):
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_request_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote request not found")
    return quote

@router.patch("/api/v1/quote-requests/{quote_request_id}/status", response_model=QuoteRequestOut)
def update_quote_status(quote_request_id: str, payload: QuoteRequestStatusUpdate, db: Session = Depends(get_db)):
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_request_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote request not found")

    with replay_transaction(db):
        quote.status = payload.status
        emit_continuity_event(
            db,
            business_owner_id=quote.business_owner_id,
            business_category_key=quote.business_category_key,
            business_line=quote.business_line,
            event_type=ContinuityEventType.QUOTE_REQUEST_STATUS_UPDATED,
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=quote.business_owner_id,
            related_entity_type=EntityType.QUOTE_REQUEST,
            related_entity_id=str(quote.id),
            payload={"new_status": payload.status.value},
            auto_commit=False
        )
        db.refresh(quote)
    return quote
