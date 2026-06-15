from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction, get_db
from src.models.advertisement import Advertisement
from src.schemas.advertisement_schema import AdvertisementCreate, AdvertisementOut

router = APIRouter()


@router.post("/advertisements/public", response_model=AdvertisementOut)
def create_advertisement(ad_in: AdvertisementCreate, db: Session = Depends(get_db)):
    with replay_transaction(db):
        now = datetime.now(timezone.utc)
        expires_at = ad_in.expires_at if ad_in.expires_at else now + timedelta(days=3)
        
        ad_data = ad_in.model_dump(exclude={"expires_at"})
        db_ad = Advertisement(
            **ad_data,
            expires_at=expires_at,
            payment_status="pending",
            advert_status="pending_review"
        )
        db.add(db_ad)
        db.flush()
        db.refresh(db_ad)
    return db_ad

@router.get("/advertisements/public", response_model=list[AdvertisementOut])
def list_active_advertisements(
    province: Optional[str] = None,
    town_or_city: Optional[str] = None,
    category_key: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Advertisement).filter(
        Advertisement.advert_status == "active",
        Advertisement.expires_at > datetime.now(timezone.utc)
    )
    if province:
        query = query.filter(Advertisement.province == province)
    if town_or_city:
        query = query.filter(Advertisement.town_or_city == town_or_city)
    if category_key:
        query = query.filter(Advertisement.category_key == category_key)
    if q:
        search = f"%{q}%"
        query = query.filter(
            (Advertisement.title.like(search)) | 
            (Advertisement.description.like(search))
        )
    
    return query.order_by(Advertisement.created_at.desc()).all()

@router.get("/admin/advertisements/pending", response_model=list[AdvertisementOut])
def list_pending_advertisements(db: Session = Depends(get_db)):
    # Simple unauthenticated admin route for V1 - in reality should have admin auth
    return db.query(Advertisement).filter(
        Advertisement.advert_status == "pending_review"
    ).order_by(Advertisement.created_at.asc()).all()

from uuid import UUID

@router.patch("/admin/advertisements/{ad_id}/approve", response_model=AdvertisementOut)
def approve_advertisement(ad_id: UUID, db: Session = Depends(get_db)):
    with replay_transaction(db):
        ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
        if not ad:
            raise HTTPException(status_code=404, detail="Advertisement not found")
        
        ad.payment_status = "paid"
        ad.advert_status = "active"
        db.flush()
        db.refresh(ad)
    return ad

@router.patch("/admin/advertisements/{ad_id}/reject", response_model=AdvertisementOut)
def reject_advertisement(ad_id: UUID, db: Session = Depends(get_db)):
    with replay_transaction(db):
        ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
        if not ad:
            raise HTTPException(status_code=404, detail="Advertisement not found")
        
        ad.payment_status = "rejected"
        ad.advert_status = "rejected"
        db.flush()
        db.refresh(ad)
    return ad
