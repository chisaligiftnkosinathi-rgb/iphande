from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date
from src.database import SessionLocal
from src.models.followup import FollowUp
from src.schemas.followup_schema import FollowUpCreate, FollowUpOut

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/followups", response_model=FollowUpOut)
def create_followup(followup: FollowUpCreate, db: Session = Depends(get_db)):
    db_followup = FollowUp(**followup.dict())
    db.add(db_followup)
    db.commit()
    db.refresh(db_followup)
    return db_followup

@router.get("/followups/today", response_model=list[FollowUpOut])
def get_today_followups(db: Session = Depends(get_db)):
    today = date.today()
    return db.query(FollowUp).filter(FollowUp.due_date >= today, FollowUp.due_date < today.replace(day=today.day+1)).all()

@router.patch("/followups/{followup_id}/complete", response_model=FollowUpOut)
def complete_followup(followup_id: str, db: Session = Depends(get_db)):
    followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="FollowUp not found")
    followup.completed = True
    db.commit()
    db.refresh(followup)
    return followup
