from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from src.database import get_db, replay_transaction
from src.models.continuity_event_model import ContinuityEvent
from src.models.quote_request_model import QuoteRequest, QuoteRequestStatus
from src.replay.constants import ActorType, ContinuityEventType, EntityType
from src.schemas.quote_request_schema import (
    QuoteRequestCreate,
    QuoteRequestOut,
    QuoteRequestStatusUpdate,
)
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter()

STATUS_ALIASES = {
    QuoteRequestStatus.new: QuoteRequestStatus.quote_requested,
    QuoteRequestStatus.contacted: QuoteRequestStatus.quote_contacted,
    QuoteRequestStatus.quoted: QuoteRequestStatus.quote_reviewed,
    QuoteRequestStatus.accepted: QuoteRequestStatus.quote_converted,
    QuoteRequestStatus.declined: QuoteRequestStatus.quote_closed,
    QuoteRequestStatus.closed: QuoteRequestStatus.quote_closed,
}


def normalize_quote_status(status: QuoteRequestStatus) -> QuoteRequestStatus:
    return STATUS_ALIASES.get(status, status)


def parse_quote_request_id(quote_request_id: str) -> UUID:
    try:
        return UUID(quote_request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quote request id")


def get_latest_quote_request_event(db: Session, quote_request_id: str):
    return (
        db.query(ContinuityEvent)
        .filter(
            ContinuityEvent.related_entity_type == EntityType.QUOTE_REQUEST,
            ContinuityEvent.related_entity_id == quote_request_id,
        )
        .order_by(ContinuityEvent.lineage_sequence.desc())
        .first()
    )


def transition_quote_request_status(
    *,
    quote_request_id: str,
    next_status: QuoteRequestStatus,
    db: Session,
):
    quote_id = parse_quote_request_id(quote_request_id)
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote request not found")

    next_status = normalize_quote_status(next_status)
    previous_status = normalize_quote_status(quote.status)
    if previous_status == next_status:
        quote.status = next_status
        return quote

    with replay_transaction(db):
        parent_event = get_latest_quote_request_event(db, quote_request_id)
        quote.status = next_status
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
            parent_event_id=parent_event.id if parent_event else None,
            payload={
                "previous_status": previous_status.value,
                "next_status": next_status.value,
                "customer_name": quote.customer_name,
                "service_needed": quote.service_needed,
                "post_id": quote.post_id,
            },
            auto_commit=False,
        )
        db.refresh(quote)
    return quote


@router.post("/api/v1/quote-requests", response_model=QuoteRequestOut)
def create_quote_request(payload: QuoteRequestCreate, db: Session = Depends(get_db)):
    db_quote_request = QuoteRequest(**payload.model_dump())
    db.add(db_quote_request)
    db.commit()
    db.refresh(db_quote_request)

    emit_continuity_event(
        db,
        business_owner_id=db_quote_request.business_owner_id,
        business_category_key=db_quote_request.business_category_key,
        business_line=db_quote_request.business_line,
        event_type="quote_request_received",
        actor_type=ActorType.CUSTOMER,
        actor_id=db_quote_request.customer_phone,
        related_entity_type=EntityType.QUOTE_REQUEST,
        related_entity_id=str(db_quote_request.id),
        payload={
            "customer_name": db_quote_request.customer_name,
            "customer_phone": db_quote_request.customer_phone,
            "customer_location": db_quote_request.customer_location,
            "service_needed": db_quote_request.service_needed,
            "preferred_date": db_quote_request.preferred_date,
            "message": db_quote_request.message,
            "post_id": db_quote_request.post_id,
            "status": db_quote_request.status.value,
        },
    )

    return db_quote_request


@router.get("/api/v1/quote-requests", response_model=list[QuoteRequestOut])
def list_quote_requests(
    business_owner_id: str | None = Query(default=None),
    status: QuoteRequestStatus | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(QuoteRequest)
    if business_owner_id:
        query = query.filter(QuoteRequest.business_owner_id == business_owner_id)
    if status:
        query = query.filter(QuoteRequest.status == normalize_quote_status(status))
    return query.order_by(QuoteRequest.created_at.desc()).all()


@router.get("/api/v1/quote-requests/{quote_request_id}", response_model=QuoteRequestOut)
def get_quote_request(quote_request_id: str, db: Session = Depends(get_db)):
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == parse_quote_request_id(quote_request_id)).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote request not found")
    return quote


@router.patch("/api/v1/quote-requests/{quote_request_id}/status", response_model=QuoteRequestOut)
def update_quote_status(
    quote_request_id: str,
    payload: QuoteRequestStatusUpdate,
    db: Session = Depends(get_db),
):
    return transition_quote_request_status(
        quote_request_id=quote_request_id,
        next_status=payload.status,
        db=db,
    )


@router.post("/api/v1/quote-requests/{quote_request_id}/review", response_model=QuoteRequestOut)
def review_quote_request(quote_request_id: str, db: Session = Depends(get_db)):
    return transition_quote_request_status(
        quote_request_id=quote_request_id,
        next_status=QuoteRequestStatus.quote_reviewed,
        db=db,
    )


@router.post("/api/v1/quote-requests/{quote_request_id}/contact", response_model=QuoteRequestOut)
def contact_quote_request(quote_request_id: str, db: Session = Depends(get_db)):
    return transition_quote_request_status(
        quote_request_id=quote_request_id,
        next_status=QuoteRequestStatus.quote_contacted,
        db=db,
    )


@router.post("/api/v1/quote-requests/{quote_request_id}/convert", response_model=QuoteRequestOut)
def convert_quote_request(quote_request_id: str, db: Session = Depends(get_db)):
    return transition_quote_request_status(
        quote_request_id=quote_request_id,
        next_status=QuoteRequestStatus.quote_converted,
        db=db,
    )


@router.post("/api/v1/quote-requests/{quote_request_id}/close", response_model=QuoteRequestOut)
def close_quote_request(quote_request_id: str, db: Session = Depends(get_db)):
    return transition_quote_request_status(
        quote_request_id=quote_request_id,
        next_status=QuoteRequestStatus.quote_closed,
        db=db,
    )
