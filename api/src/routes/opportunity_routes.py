from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction
from src.models.opportunity import Opportunity
from src.schemas.opportunity_schema import OpportunityCreate, OpportunityOut, OpportunityUpdate
from src.services.continuity_event_service import emit_continuity_event
from src.replay.constants import ContinuityEventType, ActorType, EntityType

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
        db.refresh(db_opp)
        emit_continuity_event(
            db,
            business_owner_id=db_opp.profile_id,
            business_category_key=None,
            business_line=None,
            event_type=ContinuityEventType.ENTITY_CREATED,
            actor_type=ActorType.BUSINESS_OWNER,
            related_entity_type=EntityType.OPPORTUNITY,
            related_entity_id=str(db_opp.id),
            payload={"title": db_opp.title},
            auto_commit=False
        )
    return db_opp

@router.get("/opportunities", response_model=list[OpportunityOut])
def list_opportunities(db: Session = Depends(get_db)):
    return db.query(Opportunity).all()

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

    with replay_transaction(db):
        for key, value in update.dict(exclude_unset=True).items():
            setattr(opp, key, value)

        emit_continuity_event(
            db,
            business_owner_id=opp.profile_id,
            business_category_key=None,
            business_line=None,
            event_type=ContinuityEventType.ENTITY_UPDATED,
            actor_type=ActorType.BUSINESS_OWNER,
            related_entity_type=EntityType.OPPORTUNITY,
            related_entity_id=str(opp.id),
            payload={"status": opp.status},
            auto_commit=False
        )
        db.refresh(opp)
    return opp
