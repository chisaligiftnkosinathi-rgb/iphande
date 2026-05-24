from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.reflection import Reflection
from src.schemas.reflection_schema import ReflectionCreate, ReflectionUpdate, ReflectionOut
from src.services.reflection_service import create_reflection_timeline_event
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/reflections", response_model=ReflectionOut)
def create_reflection(reflection: ReflectionCreate, db: Session = Depends(get_db)):
    db_reflection = Reflection(**reflection.dict())
    db.add(db_reflection)
    db.commit()
    db.refresh(db_reflection)
    create_reflection_timeline_event(db, db_reflection.id, "created", "Reflection created")
    return db_reflection

@router.get("/reflections", response_model=list[ReflectionOut])
def list_reflections(db: Session = Depends(get_db)):
    return db.query(Reflection).all()

@router.get("/reflections/{reflection_id}", response_model=ReflectionOut)
def get_reflection(reflection_id: str, db: Session = Depends(get_db)):
    reflection = db.query(Reflection).filter(Reflection.id == reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")
    return reflection

@router.patch("/reflections/{reflection_id}", response_model=ReflectionOut)
def update_reflection(reflection_id: str, update: ReflectionUpdate, db: Session = Depends(get_db)):
    reflection = db.query(Reflection).filter(Reflection.id == reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(reflection, key, value)
    reflection.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(reflection)
    create_reflection_timeline_event(db, reflection.id, "updated", "Reflection updated")
    return reflection

@router.delete("/reflections/{reflection_id}")
def delete_reflection(reflection_id: str, db: Session = Depends(get_db)):
    reflection = db.query(Reflection).filter(Reflection.id == reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")
    db.delete(reflection)
    db.commit()
    create_reflection_timeline_event(db, reflection_id, "deleted", "Reflection deleted")
    return {"detail": "Reflection deleted"}
