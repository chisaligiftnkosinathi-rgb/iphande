from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
import uuid

from src.database import get_db, replay_transaction
from src.models.continuity_event_model import ContinuityEvent
from src.models.quote import Quote, QuoteStatus
from src.models.quote_request_model import QuoteRequest, QuoteRequestStatus
from src.replay.constants import ActorType, ContinuityEventType, EntityType
from src.schemas.quote_to_cash_schema import QuoteDraftFromRequestCreate, QuoteOut
from src.schemas.quote_request_schema import (
    QuoteRequestCreate,
    QuoteRequestOut,
    QuoteRequestStatusUpdate,
)
from src.services.continuity_event_service import emit_continuity_event
from src.services.state_machine import enforce_transition_for_lineage

router = APIRouter()

def normalize_quote_status(status: QuoteRequestStatus) -> QuoteRequestStatus:
    val = status.value if hasattr(status, "value") else status
    aliases = {
        "requested": getattr(QuoteRequestStatus, "quote_requested", status),
        "reviewed": getattr(QuoteRequestStatus, "quote_reviewed", status),
        "contacted": getattr(QuoteRequestStatus, "quote_contacted", status),
        "converted": getattr(QuoteRequestStatus, "quote_converted", status),
        "closed": getattr(QuoteRequestStatus, "quote_closed", status),
    }
    return aliases.get(val, status)


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

    enforce_transition_for_lineage(
        lineage_key=getattr(quote, "lineage_key", quote.business_category_key) or "commission_based_sales",
        current_state=previous_status.value if hasattr(previous_status, "value") else str(previous_status),
        target_state=next_status.value if hasattr(next_status, "value") else str(next_status),
        entity_name="QuoteRequest",
    )

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


@router.post("/api/v1/quote-requests/{quote_request_id}/submit-application", response_model=QuoteRequestOut)
def submit_quote_request_application(quote_request_id: str, db: Session = Depends(get_db)):
    return transition_quote_request_status(
        quote_request_id=quote_request_id,
        next_status=QuoteRequestStatus.application_submitted,
        db=db,
    )


@router.post("/api/v1/quote-requests/{quote_request_id}/upload-sale-evidence", response_model=QuoteRequestOut)
async def upload_sale_evidence_for_quote_request(
    quote_request_id: str,
    provider_reference_number: str = Form(...),
    evidence_type: str = Form(...),
    evidence_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    quote_id = parse_quote_request_id(quote_request_id)
    quote = db.query(QuoteRequest).filter(QuoteRequest.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote request not found")

    previous_status = normalize_quote_status(quote.status)
    file_bytes = await evidence_file.read()

    with replay_transaction(db):
        parent_event = get_latest_quote_request_event(db, quote_request_id)
        quote.status = QuoteRequestStatus.evidence_review_pending
        emit_continuity_event(
            db,
            business_owner_id=quote.business_owner_id,
            business_category_key=quote.business_category_key,
            business_line=quote.business_line,
            event_type="provider_evidence_uploaded",
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=quote.business_owner_id,
            related_entity_type=EntityType.QUOTE_REQUEST,
            related_entity_id=str(quote.id),
            parent_event_id=parent_event.id if parent_event else None,
            payload={
                "quote_request_id": str(quote.id),
                "previous_status": previous_status.value,
                "next_status": QuoteRequestStatus.evidence_review_pending.value,
                "provider_reference_number": provider_reference_number,
                "evidence_type": evidence_type,
                "file_name": evidence_file.filename,
                "content_type": evidence_file.content_type,
                "file_size_bytes": len(file_bytes),
                "customer_name": quote.customer_name,
                "service_needed": quote.service_needed,
            },
            auto_commit=False,
        )
        db.refresh(quote)

    return quote


@router.post("/api/v1/quote-requests/{quote_request_id}/confirm-sale", response_model=QuoteRequestOut)
def confirm_quote_request_sale(quote_request_id: str, db: Session = Depends(get_db)):
    return transition_quote_request_status(
        quote_request_id=quote_request_id,
        next_status=QuoteRequestStatus.sale_confirmed,
        db=db,
    )


@router.post("/api/v1/quote-requests/{quote_request_id}/quotes", response_model=QuoteOut)
def draft_quote_from_request(
    quote_request_id: str,
    payload: QuoteDraftFromRequestCreate,
    db: Session = Depends(get_db),
):
    quote_request = (
        db.query(QuoteRequest)
        .filter(QuoteRequest.id == parse_quote_request_id(quote_request_id))
        .first()
    )
    if not quote_request:
        raise HTTPException(status_code=404, detail="Quote request not found")

    existing_quote = (
        db.query(Quote)
        .filter(Quote.customer_request_id == str(quote_request.id))
        .first()
    )
    if existing_quote:
        raise HTTPException(status_code=409, detail="Quote already drafted for this request")

    service_description = (
        payload.service_description
        or quote_request.service_needed
        or quote_request.message
        or quote_request.business_line
    )
    quote_id = uuid.uuid4()
    quote = Quote(
        id=quote_id,
        business_owner_id=quote_request.business_owner_id,
        customer_request_id=str(quote_request.id),
        customer_name=quote_request.customer_name,
        customer_phone=quote_request.customer_phone,
        description=service_description,
        amount=payload.amount,
        currency=payload.currency,
        terms=payload.terms,
        status=QuoteStatus.quote_drafted,
    )

    with replay_transaction(db):
        parent_event = get_latest_quote_request_event(db, str(quote_request.id))
        event = emit_continuity_event(
            db,
            business_owner_id=quote.business_owner_id,
            business_category_key=quote_request.business_category_key,
            business_line=quote_request.business_line,
            event_type="quote_drafted",
            actor_type=ActorType.BUSINESS_OWNER,
            actor_id=quote.business_owner_id,
            related_entity_type="quote",
            related_entity_id=str(quote_id),
            parent_event_id=parent_event.id if parent_event else None,
            payload={
                "quote_request_id": str(quote_request.id),
                "quote_id": str(quote_id),
                "previous_status": None,
                "next_status": QuoteStatus.quote_drafted.value,
                "amount": str(quote.amount),
                "currency": quote.currency,
                "service_description": quote.description,
                "terms": quote.terms,
                "customer_name": quote.customer_name,
            },
            auto_commit=False,
        )
        quote.continuity_event_id = event.id
        db.add(quote)
        db.flush()
        db.refresh(quote)

    return quote
