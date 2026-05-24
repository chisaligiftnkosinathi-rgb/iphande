import uuid
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.database import get_db, replay_transaction
from src.models.giving_event import GivingEvent, GivingFlowState
from src.schemas.giving_event_schema import GivingEventPledge, GivingEventOut, StewardshipReplayOut
from src.services.continuity_event_service import emit_continuity_event
from src.domain.stewardship_giving_rules import validate_giving_transition, validate_giving_payload


router = APIRouter(prefix="/api/v1/giving-events", tags=["giving-events"])


@router.post("/pledge-demo", response_model=GivingEventOut)
def pledge_demo_giving(payload: GivingEventPledge, db: Session = Depends(get_db)):
    try:
        validate_giving_payload(payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    giving_event_id = uuid.uuid4()
    giving_event = GivingEvent(
        id=giving_event_id,
        business_owner_id=payload.business_owner_id,
        amount=payload.amount,
        currency=payload.currency,
        purpose=payload.purpose,
        state=GivingFlowState.pledged,
        giver_reference=payload.giver_reference
    )

    with replay_transaction(db):
        event = emit_continuity_event(
            db,
            business_owner_id=giving_event.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="giving_pledged_demo",
            actor_type="giver",
            actor_id=giving_event.giver_reference or "anonymous",
            related_entity_type="giving_event",
            related_entity_id=str(giving_event.id),
            payload={
                "amount": str(giving_event.amount),
                "currency": giving_event.currency,
                "purpose": giving_event.purpose.value,
            },
            auto_commit=False,
        )
        giving_event.continuity_event_id = event.id
        db.add(giving_event)
        db.flush()
        db.refresh(giving_event)
    return giving_event


@router.post("/{giving_event_id}/receive-demo", response_model=GivingEventOut)
def receive_demo_giving(giving_event_id: UUID, db: Session = Depends(get_db)):
    giving_event = db.query(GivingEvent).filter(GivingEvent.id == giving_event_id).first()
    if not giving_event:
        raise HTTPException(status_code=404, detail="Giving event not found")

    try:
        validate_giving_transition(giving_event.state.value, "received_demo")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    with replay_transaction(db):
        giving_event.state = GivingFlowState.received_demo
        event = emit_continuity_event(
            db,
            business_owner_id=giving_event.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="giving_received_demo",
            actor_type="system",
            actor_id="demo_payment",
            related_entity_type="giving_event",
            related_entity_id=str(giving_event.id),
            parent_event_id=giving_event.continuity_event_id,
            payload={
                "amount": str(giving_event.amount),
                "currency": giving_event.currency,
            },
            auto_commit=False,
        )
        giving_event.continuity_event_id = event.id
        db.flush()
        db.refresh(giving_event)
    return giving_event


@router.post("/{giving_event_id}/allocate", response_model=GivingEventOut)
def allocate_giving(giving_event_id: UUID, db: Session = Depends(get_db)):
    giving_event = db.query(GivingEvent).filter(GivingEvent.id == giving_event_id).first()
    if not giving_event:
        raise HTTPException(status_code=404, detail="Giving event not found")

    try:
        validate_giving_transition(giving_event.state.value, "allocated")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    with replay_transaction(db):
        giving_event.state = GivingFlowState.allocated
        event = emit_continuity_event(
            db,
            business_owner_id=giving_event.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="giving_allocated",
            actor_type="business_owner",
            actor_id=giving_event.business_owner_id,
            related_entity_type="giving_event",
            related_entity_id=str(giving_event.id),
            parent_event_id=giving_event.continuity_event_id,
            payload={
                "purpose": giving_event.purpose.value,
            },
            auto_commit=False,
        )
        giving_event.continuity_event_id = event.id
        db.flush()
        db.refresh(giving_event)
    return giving_event


@router.post("/{giving_event_id}/mark-used", response_model=GivingEventOut)
def mark_giving_used(giving_event_id: UUID, db: Session = Depends(get_db)):
    giving_event = db.query(GivingEvent).filter(GivingEvent.id == giving_event_id).first()
    if not giving_event:
        raise HTTPException(status_code=404, detail="Giving event not found")

    try:
        validate_giving_transition(giving_event.state.value, "used")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    with replay_transaction(db):
        giving_event.state = GivingFlowState.used
        event = emit_continuity_event(
            db,
            business_owner_id=giving_event.business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="giving_used",
            actor_type="business_owner",
            actor_id=giving_event.business_owner_id,
            related_entity_type="giving_event",
            related_entity_id=str(giving_event.id),
            parent_event_id=giving_event.continuity_event_id,
            payload={},
            auto_commit=False,
        )
        giving_event.continuity_event_id = event.id
        db.flush()
        db.refresh(giving_event)
    return giving_event


@router.get("/business/{business_owner_id}/stewardship-replay", response_model=StewardshipReplayOut)
def get_stewardship_replay(business_owner_id: str, db: Session = Depends(get_db)):
    events = (
        db.query(GivingEvent)
        .filter(GivingEvent.business_owner_id == business_owner_id)
        .order_by(GivingEvent.created_at.asc())
        .all()
    )
    currency = events[0].currency if events else "ZAR"

    total_pledged = sum((e.amount for e in events if e.state.value == "pledged"), Decimal("0"))
    total_received = sum((e.amount for e in events if e.state.value == "received_demo"), Decimal("0"))
    total_allocated = sum((e.amount for e in events if e.state.value == "allocated"), Decimal("0"))
    total_used = sum((e.amount for e in events if e.state.value in ["used", "reported"]), Decimal("0"))

    return StewardshipReplayOut(
        business_owner_id=business_owner_id,
        currency=currency,
        total_pledged=total_pledged,
        total_received=total_received,
        total_allocated=total_allocated,
        total_used=total_used,
        events=events
    )
