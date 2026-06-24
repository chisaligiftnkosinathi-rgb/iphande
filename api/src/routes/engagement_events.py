from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from src.database import get_db
from sqlalchemy.orm import Session
from src.services.engagement_engine import ingest_engagement_signal, get_engagements_for_profile

router = APIRouter(prefix="/engagement", tags=["Engagement Engine"])

class EngagementEventCreate(BaseModel):
    type: str
    actor_id: str
    target_id: str
    context: Optional[Dict[str, Any]] = None
    urgency_score: Optional[float] = 0.0
    relevance_score: Optional[float] = 0.0
    distance_km: Optional[float] = 9999.0

@router.post("/events")
def create_engagement(event: EngagementEventCreate, db: Session = Depends(get_db)):
    result = ingest_engagement_signal(db, event.dict())
    if result:
        return {"status": "dispatched", "event_id": str(result.id)}
    return {"status": "ignored", "reason": "score below engagement threshold"}

@router.get("/feed/{profile_id}")
def get_engagement_feed(profile_id: str, db: Session = Depends(get_db)):
    events = get_engagements_for_profile(db, profile_id)
    return [
        {
            "id": str(e.id),
            "type": e.type,
            "target_id": e.target_id,
            "distance_km": e.distance_km,
            "suggested_actions": e.suggested_actions,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in events
    ]
