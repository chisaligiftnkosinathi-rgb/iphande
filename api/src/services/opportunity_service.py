from src.models.timeline_event import TimelineEvent
from datetime import datetime

def create_opportunity_timeline_event(db, opportunity_id: str, event_type: str, description: str = None):
    event = TimelineEvent(
        opportunity_id=opportunity_id,
        event_type=event_type,
        description=description,
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
