from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import SessionLocal, get_db
from src.schemas.steward_timeline_schema import StewardTimelineEventOut
from src.services.steward_timeline_service import get_steward_timeline

router = APIRouter(prefix="/api/v1/steward-timeline", tags=["steward-timeline"])


@router.get("/{business_owner_id}", response_model=list[StewardTimelineEventOut])
def read_steward_timeline(business_owner_id: str, db: Session = Depends(get_db)):
    """
    A strictly read-only window into the chronological causal river of a steward's business.
    No filters, no mutations, no AI summaries.
    """
    return get_steward_timeline(db, business_owner_id)
