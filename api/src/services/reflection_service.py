from src.models.timeline_event import TimelineEvent
from datetime import datetime

def create_reflection_timeline_event(db, reflection_id: str, event_type: str, description: str = None):
    event = TimelineEvent(
        opportunity_id=reflection_id,  # For V1, use reflection_id as opportunity_id for timeline linkage
        event_type=event_type,
        description=description,
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
