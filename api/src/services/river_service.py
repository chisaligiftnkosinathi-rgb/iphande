import logging
from sqlalchemy.orm import Session
from src.models.timeline_event import TimelineEvent
from src.schemas.river_schemas import RiverEventPayload

logger = logging.getLogger(__name__)

def process_river_event(db: Session, payload: RiverEventPayload) -> TimelineEvent:
    """
    Processes an incoming River Event by recording it in the timeline.
    """
    logger.info(f"Processing river event from {payload.source}: {payload.event_id} ({payload.event_type})")
    
    # In Phase 1, we just create a generic TimelineEvent to prove the river flows.
    # We serialize the payload into the description so we don't lose data.
    description = f"[{payload.source.upper()}] {payload.event_type} - {payload.reference_id} ({payload.verification_level}) | Hash: {payload.event_hash}"
    if payload.metadata:
        description += f" | Meta: {payload.metadata}"
        
    timeline_event = TimelineEvent(
        event_type="river_bridge_event",
        description=description,
        # opportunity_id is null since this is a global event, not opportunity specific.
    )
    
    db.add(timeline_event)
    db.commit()
    db.refresh(timeline_event)
    
    logger.info(f"Successfully recorded river event {payload.event_id} to timeline ({timeline_event.id})")
    return timeline_event
