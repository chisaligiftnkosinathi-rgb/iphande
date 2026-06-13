from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction, get_db
from src.models.reflection import Reflection
from src.schemas.reflection_schema import ReflectionCreate, ReflectionUpdate, ReflectionOut
from src.services.reflection_service import create_reflection_timeline_event
from src.services.continuity_event_service import emit_continuity_event
from datetime import datetime

router = APIRouter()


@router.post("/reflections", response_model=ReflectionOut)
def create_reflection(reflection: ReflectionCreate, db: Session = Depends(get_db)):
    db_reflection = Reflection(**reflection.dict())
    db.add(db_reflection)
    db.commit()
    db.refresh(db_reflection)
    create_reflection_timeline_event(db, db_reflection.id, "created", "Reflection created")
    with replay_transaction(db):
        db.add(db_reflection)
        db.flush()
        event = emit_continuity_event(
            db,
            business_owner_id=db_reflection.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="reflection_recorded",
            actor_type="business_owner",
            actor_id=db_reflection.owner_profile_id,
            related_entity_type="reflection",
            related_entity_id=str(db_reflection.id),
            payload={
                "reflection_id": str(db_reflection.id),
                "reflection_date": db_reflection.reflection_date.isoformat() if hasattr(db_reflection.reflection_date, 'isoformat') else str(db_reflection.reflection_date),
                "has_wins": bool(db_reflection.wins),
                "has_challenges": bool(db_reflection.challenges),
            },
            auto_commit=False,
        )
        db_reflection.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_reflection)
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

    update_data = update.dict(exclude_unset=True)
    if not update_data:
        return reflection

    with replay_transaction(db):
        for key, value in update_data.items():
            setattr(reflection, key, value)
        reflection.updated_at = datetime.utcnow()

        event = emit_continuity_event(
            db,
            business_owner_id=reflection.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="reflection_amended",
            actor_type="business_owner",
            actor_id=reflection.owner_profile_id,
            related_entity_type="reflection",
            related_entity_id=str(reflection.id),
            parent_event_id=reflection.continuity_event_id,
            payload={
                "reflection_id": str(reflection.id),
                "action": "amended",
                "updated_fields": list(update_data.keys())
            },
            auto_commit=False,
        )
        reflection.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(reflection)
    return reflection

@router.delete("/reflections/{reflection_id}")
def delete_reflection(reflection_id: str, db: Session = Depends(get_db)):
    reflection = db.query(Reflection).filter(Reflection.id == reflection_id).first()
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    with replay_transaction(db):
        reflection.is_archived = True
        emit_continuity_event(
            db,
            business_owner_id=reflection.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="reflection_archived",
            actor_type="business_owner",
            actor_id=reflection.owner_profile_id,
            related_entity_type="reflection",
            related_entity_id=str(reflection.id),
            parent_event_id=reflection.continuity_event_id,
            payload={"reflection_id": str(reflection.id), "action": "archived"},
            auto_commit=False,
        )
        db.flush()
        db.refresh(reflection)
    return {"detail": "Reflection deleted"}
