from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import date, datetime
from src.database import SessionLocal
from src.models.scripture_reflection import ScriptureReflection
from src.schemas.scripture_reflection_schema import (
    ScriptureReflectionCreate, ScriptureReflectionUpdate, ScriptureReflectionRead
)
from src.services.scripture_reflection_service import get_scripture_for_situation

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/scripture-reflections", response_model=ScriptureReflectionRead)
def create_scripture_reflection(data: ScriptureReflectionCreate, db: Session = Depends(get_db)):
    scripture = get_scripture_for_situation(data.situation_key)
    if not scripture:
        raise HTTPException(status_code=400, detail="Unknown situation_key")
    db_reflection = ScriptureReflection(
        owner_profile_id=data.owner_profile_id,
        reflection_date=data.reflection_date,
        situation_key=data.situation_key,
        scripture_reference=scripture["reference"],
        scripture_text=scripture["text"],
        encouragement_note=scripture["note"],
        linked_reflection_id=data.linked_reflection_id,
        linked_opportunity_id=data.linked_opportunity_id,
        created_at=datetime.utcnow()
    )
    db.add(db_reflection)
    db.commit()
    db.refresh(db_reflection)
    return db_reflection

@router.get("/scripture-reflections", response_model=list[ScriptureReflectionRead])
def list_scripture_reflections(db: Session = Depends(get_db)):
    return db.query(ScriptureReflection).all()

@router.get("/scripture-reflections/{scripture_reflection_id}", response_model=ScriptureReflectionRead)
def get_scripture_reflection(scripture_reflection_id: str, db: Session = Depends(get_db)):
    reflection = db.query(ScriptureReflection).filter(ScriptureReflection.id == scripture_reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Scripture reflection not found")
    return reflection

@router.get("/scripture-reflections/daily/{owner_profile_id}", response_model=ScriptureReflectionRead)
def get_daily_scripture_reflection(owner_profile_id: str, db: Session = Depends(get_db)):
    today = date.today()
    reflection = db.query(ScriptureReflection).filter(
        ScriptureReflection.owner_profile_id == owner_profile_id,
        ScriptureReflection.reflection_date == today
    ).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="No scripture reflection for today")
    return reflection

@router.patch("/scripture-reflections/{scripture_reflection_id}", response_model=ScriptureReflectionRead)
def update_scripture_reflection(scripture_reflection_id: str, update: ScriptureReflectionUpdate, db: Session = Depends(get_db)):
    reflection = db.query(ScriptureReflection).filter(ScriptureReflection.id == scripture_reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Scripture reflection not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(reflection, key, value)
    db.commit()
    db.refresh(reflection)
    return reflection

@router.delete("/scripture-reflections/{scripture_reflection_id}")
def delete_scripture_reflection(scripture_reflection_id: str, db: Session = Depends(get_db)):
    reflection = db.query(ScriptureReflection).filter(ScriptureReflection.id == scripture_reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Scripture reflection not found")
    db.delete(reflection)
    db.commit()
    return {"detail": "Scripture reflection deleted"}
