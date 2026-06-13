from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from src.database import get_db
from src.models.profile import Profile
from src.models.opportunity import Opportunity
from src.models.quote import Quote
from src.models.continuity_event_model import ContinuityEvent
from src.schemas.share_schema import ShareResponseOut

router = APIRouter(prefix="/api/v1/share", tags=["Share"])

SIGNATURE = "Shared from iPhande — work remembered, trust preserved."

@router.get("/profile/{profile_id}", response_model=ShareResponseOut)
def share_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    parts = []
    if profile.name:
        parts.append(f"Hi, I'm {profile.name}")
    
    location_parts = []
    if profile.city:
        location_parts.append(profile.city)
    if profile.province:
        location_parts.append(profile.province)
    
    if location_parts:
        parts.append(f"based in {', '.join(location_parts)}.")
    else:
        if parts:
            parts[-1] += "."
            
    if profile.services:
        parts.append(f"I offer: {profile.services}.")
        
    if profile.whatsapp_number:
        parts.append(f"Contact me on WhatsApp: {profile.whatsapp_number}.")
        
    parts.append(SIGNATURE)
    
    return ShareResponseOut(
        share_text=" ".join(parts),
        source_type="profile",
        source_id=profile_id
    )

@router.get("/opportunity/{opportunity_id}", response_model=ShareResponseOut)
def share_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    parts = ["Community Notice:"]
    if opp.title:
        parts.append(opp.title + ".")
        
    service_part = ""
    if opp.service_needed:
        service_part = f"Looking for {opp.service_needed}"
    else:
        service_part = "Looking for services"
        
    location_parts = []
    if opp.town_or_city:
        location_parts.append(opp.town_or_city)
    if opp.province:
        location_parts.append(opp.province)
        
    if location_parts:
        service_part += f" in {', '.join(location_parts)}."
    else:
        service_part += "."
        
    parts.append(service_part)
    parts.append(SIGNATURE)

    return ShareResponseOut(
        share_text=" ".join(parts),
        source_type="opportunity",
        source_id=opportunity_id
    )

@router.get("/quote/{quote_id}", response_model=ShareResponseOut)
def share_quote(quote_id: str, db: Session = Depends(get_db)):
    try:
        qid = uuid.UUID(quote_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quote ID format")

    quote = db.query(Quote).filter(Quote.id == qid).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    parts = ["Quote Update:"]
    
    desc = quote.description if quote.description else "services"
    
    if quote.customer_name:
        parts.append(f"I've prepared a quote for {quote.customer_name} for {desc}.")
    else:
        parts.append(f"I've prepared a quote for {desc}.")
        
    if quote.amount is not None:
        parts.append(f"Total: R{quote.amount}.")
        
    parts.append(SIGNATURE)

    return ShareResponseOut(
        share_text=" ".join(parts),
        source_type="quote",
        source_id=quote_id
    )

@router.get("/continuity-event/{event_id}", response_model=ShareResponseOut)
def share_continuity_event(event_id: str, db: Session = Depends(get_db)):
    try:
        eid = uuid.UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    event = db.query(ContinuityEvent).filter(ContinuityEvent.id == eid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Continuity Event not found")

    if event.event_type != "work_completed":
        raise HTTPException(status_code=400, detail="Can only share work_completed events")

    parts = ["Proof of Work:"]
    
    payload = event.payload_json or {}
    
    if "title" in payload and payload["title"]:
        parts.append(payload["title"] + ".")
        
    if "description" in payload and payload["description"]:
        parts.append(payload["description"] + ".")
        
    parts.append(SIGNATURE)

    return ShareResponseOut(
        share_text=" ".join(parts),
        source_type="proof_of_work",
        source_id=event_id
    )
