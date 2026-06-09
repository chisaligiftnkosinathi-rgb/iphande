from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from src.database import SessionLocal, replay_transaction
from src.models.opportunity import Opportunity
from src.schemas.opportunity_schema import OpportunityCreate, OpportunityOut, OpportunityUpdate
from src.services.continuity_event_service import emit_continuity_event

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/opportunities", response_model=OpportunityOut)
def create_opportunity(opportunity: OpportunityCreate, db: Session = Depends(get_db)):
    with replay_transaction(db):
        db_opp = Opportunity(**opportunity.dict())
        db.add(db_opp)
        db.flush()

        event = emit_continuity_event(
            db,
            business_owner_id=db_opp.profile_id,
            business_category_key=None,
            business_line=None,
            event_type="opportunity_created",
            actor_type="business_owner",
            actor_id=db_opp.profile_id,
            related_entity_type="opportunity",
            related_entity_id=str(db_opp.id),
            parent_event_id=getattr(db_opp, "continuity_event_id", None),
            payload={
                "business_owner_id": db_opp.profile_id,
                "surface": "opportunity",
                "action": "created",
                "summary_available": True,
            },
            auto_commit=False
        )
        if hasattr(db_opp, "continuity_event_id"):
            db_opp.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_opp)
    return db_opp

@router.get("/opportunities", response_model=list[OpportunityOut])
def list_opportunities(profile_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Opportunity)
    if profile_id:
        query = query.filter(Opportunity.profile_id == profile_id)
    return query.order_by(Opportunity.created_at.desc()).all()

@router.get("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp

@router.patch("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def update_opportunity(opportunity_id: str, update: OpportunityUpdate, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    update_data = update.dict(exclude_unset=True)
    if not update_data:
        return opp

    with replay_transaction(db):
        for key, value in update_data.items():
            setattr(opp, key, value)

        event = emit_continuity_event(
            db,
            business_owner_id=opp.profile_id,
            business_category_key=None,
            business_line=None,
            event_type="opportunity_amended",
            actor_type="business_owner",
            actor_id=opp.profile_id,
            related_entity_type="opportunity",
            related_entity_id=str(opp.id),
            parent_event_id=getattr(opp, "continuity_event_id", None),
            payload={
                "updated_fields": list(update_data.keys()),
                "summary_available": True,
            },
            auto_commit=False
        )
        if hasattr(opp, "continuity_event_id"):
            opp.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(opp)
    return opp
