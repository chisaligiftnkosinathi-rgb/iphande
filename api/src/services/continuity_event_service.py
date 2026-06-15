from src.models.continuity_event_model import ContinuityEvent
from sqlalchemy.orm import Session
import json

def emit_continuity_event(
    db: Session,
    *,
    business_owner_id: str,
    business_category_key: str | None,
    business_line: str | None,
    event_type: str,
    actor_type: str,
    actor_id: str | None = None,
    related_entity_type: str | None = None,
    related_entity_id: str | None = None,
    parent_event_id: str | None = None,
    evidence_type: str | None = None,
    title: str | None = None,
    description: str | None = None,
    source: str | None = None,
    payload: dict | None = None,
    auto_commit: bool = True,
):
    # Enforce parent integrity to prevent broken causality chains
    if parent_event_id:
        parent_event = db.query(ContinuityEvent).filter(ContinuityEvent.id == parent_event_id).first()
        if not parent_event:
            raise ValueError(f"Parent event {parent_event_id} not found. Cannot enforce causality.")

    event = ContinuityEvent(
        business_owner_id=business_owner_id,
        business_category_key=business_category_key,
        business_line=business_line,
        event_type=event_type,
        actor_type=actor_type,
        actor_id=actor_id,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        parent_event_id=parent_event_id,
        evidence_type=evidence_type,
        title=title,
        description=description,
        source=source,
        payload_json=payload if payload is not None else None,
    )
    db.add(event)
    if auto_commit:
        db.commit()
        db.refresh(event)
    else:
        db.flush()
    return event
