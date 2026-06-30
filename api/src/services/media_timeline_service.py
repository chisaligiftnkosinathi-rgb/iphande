from datetime import datetime
from src.models.timeline_event import TimelineEvent


# ---------------------------------------------------
# CREATE TIMELINE EVENT (NO DB COMMIT INSIDE SERVICE)
# ---------------------------------------------------

def create_media_timeline_event(db, media_id: str, event_type: str, description: str = None):
    event = TimelineEvent(
        opportunity_id=media_id,
        event_type=event_type,
        description=description,
        created_at=datetime.utcnow(),
    )

    db.add(event)

    # IMPORTANT:
    # Let caller control commit/transaction boundary
    db.flush()

    return event
