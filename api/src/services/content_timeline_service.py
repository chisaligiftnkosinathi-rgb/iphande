from src.models.continuity_event_model import ContinuityEvent
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime

def get_content_timeline(db: Session, content_post_id: str):
    events = db.query(ContinuityEvent).filter(
        ContinuityEvent.related_entity_type == "content_post",
        ContinuityEvent.related_entity_id == content_post_id
    ).order_by(ContinuityEvent.lineage_sequence.asc()).all()
    timeline_events = []
    for ev in events:
        payload = ev.payload_json or {}
        timeline_events.append({
            "event_type": ev.event_type,
            "occurred_at": ev.created_at,
            "platform": payload.get("platform", "unknown"),
            "goal_key": payload.get("goal_key"),
            "business_category_key": ev.business_category_key,
            "payload": payload,
        })
    return {
        "content_post_id": content_post_id,
        "event_count": len(timeline_events),
        "events": timeline_events,
    }
