from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.media import Media
from src.schemas.media_schema import MediaCreate, MediaUpdate, MediaOut
from src.services.media_service import create_media_timeline_event
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/media", response_model=MediaOut)
def create_media(media: MediaCreate, db: Session = Depends(get_db)):
    db_media = Media(**media.dict())
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    create_media_timeline_event(db, db_media.id, "created", "Media created")
    return db_media

@router.get("/media", response_model=list[MediaOut])
def list_media(db: Session = Depends(get_db)):
    return db.query(Media).all()

@router.get("/media/{media_id}", response_model=MediaOut)
def get_media(media_id: str, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    return media

@router.patch("/media/{media_id}", response_model=MediaOut)
def update_media(media_id: str, update: MediaUpdate, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    for key, value in update.dict(exclude_unset=True).items():
        setattr(media, key, value)
    media.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(media)
    create_media_timeline_event(db, media.id, "updated", "Media updated")
    return media

@router.delete("/media/{media_id}")
def delete_media(media_id: str, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    db.delete(media)
    db.commit()
    create_media_timeline_event(db, media_id, "deleted", "Media deleted")
    return {"detail": "Media deleted"}
