from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.giving_model import Giving as GivingModel, GivingStatus
from ..schemas.giving_schema import Giving as GivingSchema, GivingCreate, GivingStatusUpdate
from uuid import UUID

router = APIRouter(prefix="/api/v1/giving", tags=["giving"])

@router.post("/", response_model=GivingSchema)
def create_giving(giving: GivingCreate, db: Session = Depends(get_db)):
    db_giving = GivingModel(**giving.model_dump())
    db.add(db_giving)
    db.commit()
    db.refresh(db_giving)
    return db_giving

@router.get("/", response_model=list[GivingSchema])
def list_giving(db: Session = Depends(get_db)):
    return db.query(GivingModel).all()

@router.get("/{giving_id}", response_model=GivingSchema)
def get_giving(giving_id: UUID, db: Session = Depends(get_db)):
    giving = db.query(GivingModel).filter(GivingModel.id == giving_id).first()
    if not giving:
        raise HTTPException(status_code=404, detail="Giving not found")
    return giving

@router.patch("/{giving_id}/status", response_model=GivingSchema)
def update_giving_status(giving_id: UUID, status_update: GivingStatusUpdate, db: Session = Depends(get_db)):
    giving = db.query(GivingModel).filter(GivingModel.id == giving_id).first()
    if not giving:
        raise HTTPException(status_code=404, detail="Giving not found")
    giving.status = status_update.status
    db.commit()
    db.refresh(giving)
    return giving
