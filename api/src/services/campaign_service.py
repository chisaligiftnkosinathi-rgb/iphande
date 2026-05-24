from src.models.timeline_event import TimelineEvent
from datetime import datetime

def create_campaign_timeline_event(db, campaign_id: str, event_type: str, description: str = None):
    event = TimelineEvent(
        opportunity_id=campaign_id,  # For V1, use campaign_id as opportunity_id for timeline linkage
        event_type=event_type,
        description=description,
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
