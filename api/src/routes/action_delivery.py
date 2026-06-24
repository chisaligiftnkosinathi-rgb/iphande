from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.engagement_event import EngagementEvent
from src.services.action_delivery import build_action_packets, queue, get_pending, mark_delivered

router = APIRouter(prefix="/actions", tags=["Action Delivery Engine"])

# Note: In a real flow, you'd ingest an EngagementEvent model or Pydantic schema here.
# For simplicity, we are accepting a dict and querying the db model if we need to.
@router.post("/dispatch")
async def dispatch_actions(event_id: str, db: Session = Depends(get_db)):
    event = db.query(EngagementEvent).filter(EngagementEvent.id == event_id).first()
    if not event:
        return {"status": "error", "message": "Event not found"}
        
    packets = build_action_packets(event)
    return await queue(db, packets)

@router.get("/inbox/{profile_id}")
def get_inbox(profile_id: str, db: Session = Depends(get_db)):
    pending = get_pending(db, profile_id)
    return [
        {
            "id": str(p.id),
            "event_id": p.event_id,
            "channel": p.channel,
            "title": p.title,
            "body": p.body,
            "action_type": p.action_type,
            "priority": p.priority,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in pending
    ]

@router.post("/{action_id}/deliver")
def deliver_action(action_id: str, db: Session = Depends(get_db)):
    return mark_delivered(db, action_id)
