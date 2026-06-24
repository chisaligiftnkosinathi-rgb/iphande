from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.feedback_event import FeedbackEvent
from src.services.feedback_engine import process_feedback

router = APIRouter(prefix="/feedback", tags=["Feedback Intelligence"])

class FeedbackEventCreate(BaseModel):
    profile_id: str
    action_packet_id: str
    engagement_event_id: Optional[str] = None
    event_type: str
    dwell_time_seconds: Optional[int] = None
    context: Optional[Dict[str, Any]] = None

@router.post("/events")
def ingest_feedback(event: FeedbackEventCreate, db: Session = Depends(get_db)):
    db_event = FeedbackEvent(
        profile_id=event.profile_id,
        action_packet_id=event.action_packet_id,
        engagement_event_id=event.engagement_event_id,
        event_type=event.event_type,
        dwell_time_seconds=event.dwell_time_seconds,
        context=event.context
    )
    result = process_feedback(db, db_event)
    return {"status": "success", "event_id": str(result.id)}
