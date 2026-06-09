from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import SessionLocal, replay_transaction
from src.models.campaign import Campaign
from src.schemas.campaign_schema import CampaignCreate, CampaignUpdate, CampaignOut
from src.services.continuity_event_service import emit_continuity_event
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/campaigns", response_model=CampaignOut)
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    with replay_transaction(db):
        db_campaign = Campaign(**campaign.dict())
        db.add(db_campaign)
        db.flush()

        event = emit_continuity_event(
            db,
            business_owner_id=db_campaign.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="campaign_created",
            actor_type="business_owner",
            actor_id=db_campaign.owner_profile_id,
            related_entity_type="campaign",
            related_entity_id=str(db_campaign.id),
            parent_event_id=None,
            payload={
                "surface": "campaign",
                "action": "created",
                "summary_available": True,
            },
            auto_commit=False,
        )
        db_campaign.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_campaign)
    return db_campaign

@router.get("/campaigns", response_model=list[CampaignOut])
def list_campaigns(db: Session = Depends(get_db)):
    return db.query(Campaign).all()

@router.get("/campaigns/{campaign_id}", response_model=CampaignOut)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.patch("/campaigns/{campaign_id}", response_model=CampaignOut)
def update_campaign(campaign_id: str, update: CampaignUpdate, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_data = update.dict(exclude_unset=True)
    if not update_data:
        return campaign

    with replay_transaction(db):
        for key, value in update_data.items():
            setattr(campaign, key, value)
        campaign.updated_at = datetime.utcnow()

        event = emit_continuity_event(
            db,
            business_owner_id=campaign.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="campaign_amended",
            actor_type="business_owner",
            actor_id=campaign.owner_profile_id,
            related_entity_type="campaign",
            related_entity_id=str(campaign.id),
            parent_event_id=getattr(campaign, "continuity_event_id", None),
            payload={
                "surface": "campaign",
                "action": "amended",
                "updated_fields": list(update_data.keys()),
                "summary_available": True,
            },
            auto_commit=False,
        )
        campaign.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(campaign)
    return campaign

@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    with replay_transaction(db):
        campaign.is_archived = True
        emit_continuity_event(
            db,
            business_owner_id=campaign.owner_profile_id,
            business_category_key=None,
            business_line=None,
            event_type="campaign_archived",
            actor_type="business_owner",
            actor_id=campaign.owner_profile_id,
            related_entity_type="campaign",
            related_entity_id=str(campaign.id),
            parent_event_id=getattr(campaign, "continuity_event_id", None),
            payload={
                "surface": "campaign",
                "action": "archived",
                "summary_available": True,
            },
            auto_commit=False,
        )
        db.flush()
        db.refresh(campaign)
    return {"detail": "Campaign archived"}
