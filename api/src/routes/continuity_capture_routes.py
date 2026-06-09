from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from src.schemas.continuity_capture_schema import (
    ContinuityCaptureCreate, ContinuityCaptureRead
)
from src.services.continuity_capture_service import (
    create_continuity_capture, get_captures_by_steward, get_capture_by_id
)
from src.models.continuity_capture import ContinuityCapture
from src.database import get_db

router = APIRouter(tags=["continuity-captures"])

@router.post("", response_model=ContinuityCaptureRead)
def create_capture(capture_in: ContinuityCaptureCreate, db: Session = Depends(get_db)):
    capture = create_continuity_capture(db, capture_in)
    return capture

@router.get("", response_model=List[ContinuityCaptureRead])
def list_captures(steward_id: str = Query(...), db: Session = Depends(get_db)):
    return get_captures_by_steward(db, steward_id)

@router.get("/{capture_id}", response_model=ContinuityCaptureRead)
def read_capture(capture_id: UUID, db: Session = Depends(get_db)):
    capture = get_capture_by_id(db, capture_id)
    if not capture:
        raise HTTPException(status_code=404, detail="Continuity capture not found")
    return capture
