from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Literal
from src.schemas.continuity_event_schema import (
    ContinuityEventCreate,
    ContinuityEventGraphEdge,
    ContinuityEventGraphResponse,
    ContinuityEventResponse,
)
from src.models.continuity_event_model import ContinuityEvent
from src.models.profile import Profile
from src.database import get_db
from src.services.continuity_event_service import emit_continuity_event
from src.services.verification_service import require_verified_steward_or_platform_admin
from src.auth.supabase_auth import get_current_user

router = APIRouter()

@router.post("/", response_model=ContinuityEventResponse)
def create_event(
    event: ContinuityEventCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if event.business_owner_id:
        requester = db.query(Profile).filter(Profile.owner_id == current_user["uid"]).first()

        if requester and (
            requester.trust_posture == "system_creator"
            or requester.role in ("admin", "system_admin")
        ):
            pass
        else:
            if not requester or str(requester.id) != str(event.business_owner_id):
                raise HTTPException(status_code=403, detail="Not allowed to create events for this timeline")
            require_verified_steward_or_platform_admin(requester)

    db_event = emit_continuity_event(
        db,
        business_owner_id=event.business_owner_id,
        business_category_key=event.business_category_key,
        business_line=event.business_line,
        event_type=event.event_type,
        actor_type=event.actor_type,
        actor_id=event.actor_id,
        related_entity_type=event.related_entity_type,
        related_entity_id=event.related_entity_id,
        parent_event_id=event.parent_event_id,
        payload=event.payload_json,
    )
    return db_event

@router.get("/", response_model=List[ContinuityEventResponse])
def list_events(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    events = db.query(ContinuityEvent).order_by(ContinuityEvent.lineage_sequence.asc()).offset(offset).limit(limit).all()
    return events

@router.get("/{event_id}/graph", response_model=ContinuityEventGraphResponse)
def get_event_graph(
    event_id: UUID,
    max_depth: int = Query(default=5, ge=0),
    direction: Literal["upstream", "downstream", "both"] = Query(default="both"),
    db: Session = Depends(get_db),
):
    root_event = db.query(ContinuityEvent).filter(ContinuityEvent.id == event_id).first()
    if not root_event:
        raise HTTPException(status_code=404, detail="Event not found")

    nodes_by_id = {root_event.id: root_event}
    edges_by_key: dict[tuple[UUID, UUID], ContinuityEventGraphEdge] = {}
    truncated = False
    cycle_detected = False

    def add_edge(parent_id: UUID, child_id: UUID):
        edges_by_key[(parent_id, child_id)] = ContinuityEventGraphEdge(
            source_event_id=parent_id,
            target_event_id=child_id,
        )

    def traverse_upstream(event: ContinuityEvent, depth: int, path: set[UUID]):
        nonlocal truncated, cycle_detected
        if not event.parent_event_id:
            return

        if depth >= max_depth:
            truncated = True
            return

        if event.parent_event_id in path:
            cycle_detected = True
            return

        parent = db.query(ContinuityEvent).filter(ContinuityEvent.id == event.parent_event_id).first()
        if not parent:
            return

        nodes_by_id[parent.id] = parent
        add_edge(parent.id, event.id)
        traverse_upstream(parent, depth + 1, path | {parent.id})

    def traverse_downstream(event: ContinuityEvent, depth: int, path: set[UUID]):
        nonlocal truncated, cycle_detected
        children = (
            db.query(ContinuityEvent)
            .filter(ContinuityEvent.parent_event_id == event.id)
            .order_by(ContinuityEvent.lineage_sequence.asc())
            .all()
        )
        if not children:
            return

        if depth >= max_depth:
            truncated = True
            return

        for child in children:
            if child.id in path:
                cycle_detected = True
                continue
            nodes_by_id[child.id] = child
            add_edge(event.id, child.id)
            traverse_downstream(child, depth + 1, path | {child.id})

    if direction in ("upstream", "both"):
        traverse_upstream(root_event, 0, {root_event.id})
    if direction in ("downstream", "both"):
        traverse_downstream(root_event, 0, {root_event.id})

    ordered_nodes = sorted(nodes_by_id.values(), key=lambda event: event.lineage_sequence)
    ordered_edges = sorted(
        edges_by_key.values(),
        key=lambda edge: (
            nodes_by_id[edge.source_event_id].lineage_sequence,
            nodes_by_id[edge.target_event_id].lineage_sequence,
        ),
    )

    return ContinuityEventGraphResponse(
        root_event=root_event,
        nodes=ordered_nodes,
        edges=ordered_edges,
        truncated=truncated,
        max_depth=max_depth,
        cycle_detected=cycle_detected,
        direction=direction,
    )

@router.get("/entity/{entity_id}", response_model=List[ContinuityEventResponse])
def get_events_for_entity(
    entity_id: str,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    events = (
        db.query(ContinuityEvent)
        .filter(ContinuityEvent.related_entity_id == entity_id)
        .order_by(ContinuityEvent.lineage_sequence.asc())
        .offset(offset).limit(limit)
        .all()
    )
    return events

@router.get("/business/{business_owner_id}", response_model=List[ContinuityEventResponse])
def get_events_for_business(
    business_owner_id: str,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    requester = db.query(Profile).filter(Profile.owner_id == current_user["uid"]).first()

    if requester and (
        requester.trust_posture == "system_creator"
        or requester.role in ("admin", "system_admin")
    ):
        pass
    else:
        if not requester or str(requester.id) != str(business_owner_id):
            raise HTTPException(status_code=403, detail="Not allowed to view this timeline")
        require_verified_steward_or_platform_admin(requester)

    events = (
        db.query(ContinuityEvent)
        .filter(ContinuityEvent.business_owner_id == business_owner_id)
        .order_by(ContinuityEvent.lineage_sequence.asc())
        .offset(offset).limit(limit)
        .all()
    )
    return events

@router.get("/parent/{event_id}/children", response_model=List[ContinuityEventResponse])
def get_event_children(
    event_id: UUID,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    events = (
        db.query(ContinuityEvent)
        .filter(ContinuityEvent.parent_event_id == event_id)
        .order_by(ContinuityEvent.lineage_sequence.asc())
        .offset(offset).limit(limit)
        .all()
    )
    return events

@router.get("/{event_id}", response_model=ContinuityEventResponse)
def get_event(event_id: UUID, db: Session = Depends(get_db)):
    event = db.query(ContinuityEvent).filter(ContinuityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
