from sqlalchemy.orm import Session
from src.models.continuity_capture import ContinuityCapture
from src.schemas.continuity_capture_schema import ContinuityCaptureCreate
from uuid import UUID
from typing import List, Optional

def create_continuity_capture(db: Session, capture_in: ContinuityCaptureCreate) -> ContinuityCapture:
    capture = ContinuityCapture(
        steward_id=capture_in.steward_id,
        source_type=capture_in.source_type,
        raw_text=capture_in.raw_text,
        raw_media_id=capture_in.raw_media_id,
        context_hint=capture_in.context_hint,
        status=capture_in.status or "captured"
    )
    db.add(capture)
    db.commit()
    db.refresh(capture)
    return capture

def get_captures_by_steward(db: Session, steward_id: str) -> List[ContinuityCapture]:
    return db.query(ContinuityCapture).filter(ContinuityCapture.steward_id == steward_id).all()

def get_capture_by_id(db: Session, capture_id: UUID) -> Optional[ContinuityCapture]:
    return db.query(ContinuityCapture).filter(ContinuityCapture.id == capture_id).first()
