from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.timeline_event import TimelineEvent
from src.schemas.timeline_schema import TimelineEventCreate, TimelineEventOut

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/opportunities/{opportunity_id}/timeline", response_model=TimelineEventOut)
def add_timeline_event(opportunity_id: str, event: TimelineEventCreate, db: Session = Depends(get_db)):
    db_event = TimelineEvent(opportunity_id=opportunity_id, **event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/opportunities/{opportunity_id}/timeline", response_model=list[TimelineEventOut])
def get_timeline(opportunity_id: str, db: Session = Depends(get_db)):
    return db.query(TimelineEvent).filter(TimelineEvent.opportunity_id == opportunity_id).all()
