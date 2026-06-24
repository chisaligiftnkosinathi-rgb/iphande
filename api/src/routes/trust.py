from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
import src.services.trust_engine as trust_engine

router = APIRouter(prefix="/trust", tags=["Trust Engine"])

@router.post("/recalculate/{profile_id}")
def recalc(profile_id: str, db: Session = Depends(get_db)):
    return trust_engine.recalculate(db, profile_id)
