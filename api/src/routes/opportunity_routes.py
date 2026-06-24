from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from src.database import SessionLocal, replay_transaction, get_db
from src.models.opportunity import Opportunity
from src.schemas.opportunity_schema import OpportunityCreate, OpportunityOut, OpportunityUpdate
from src.services.continuity_event_service import emit_continuity_event
from src.services.verification_service import require_verified_steward_or_platform_admin
from src.models.profile import Profile

router = APIRouter()

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/opportunities", response_model=OpportunityOut)
def create_opportunity(opportunity: OpportunityCreate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == opportunity.created_by_profile_id).first()
    require_verified_steward_or_platform_admin(profile)

    with replay_transaction(db):
        db_opp = Opportunity(**opportunity.model_dump())
        db.add(db_opp)
        db.flush()

        # Generate candidates and allocate
        from src.routes.geo_match import match_opportunity_to_profiles, get_public_profiles
        from src.services.opportunity_allocator import opportunity_allocator

        profiles = get_public_profiles(db)
        matches = match_opportunity_to_profiles(db_opp, profiles)
        allocation = opportunity_allocator.allocate(db_opp, matches)

        # If we have an auto-assignment, persist it (assuming assigned_to_profile_id exists or we add it)
        if allocation["status"] == "auto_assigned" and allocation["assigned_profile_id"]:
            # Note: For v1, we just emit this in the payload, but later we would explicitly set db_opp.assigned_to_profile_id = allocation["assigned_profile_id"]
            pass

        event = emit_continuity_event(
            db,
            business_owner_id=db_opp.created_by_profile_id,
            business_category_key=db_opp.category_key,
            business_line=db_opp.service_needed,
            event_type="opportunity_created",
            actor_type="business_owner",
            actor_id=db_opp.created_by_profile_id,
            related_entity_type="opportunity",
            related_entity_id=str(db_opp.id),
            parent_event_id=getattr(db_opp, "continuity_event_id", None),
            payload={
                "created_by_profile_id": db_opp.created_by_profile_id,
                "surface": "opportunity",
                "action": "created",
                "summary_available": True,
                "allocation": allocation
            },
            auto_commit=False
        )
        if hasattr(db_opp, "continuity_event_id"):
            db_opp.continuity_event_id = str(event.id)
        db.flush()
        db.refresh(db_opp)
    return db_opp

@router.get("/opportunities", response_model=list[OpportunityOut])
def list_opportunities(
    profile_id: Optional[str] = None,
    province: Optional[str] = None,
    town_or_city: Optional[str] = None,
    category_key: Optional[str] = None,
    place_code: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity)
    if profile_id:
        query = query.filter(Opportunity.created_by_profile_id == profile_id)
    if province:
        query = query.filter(Opportunity.province == province)
    if town_or_city:
        query = query.filter(Opportunity.town_or_city == town_or_city)
    if category_key:
        query = query.filter(Opportunity.category_key == category_key)
    if place_code:
        query = query.filter(Opportunity.place_code == place_code)
    if q:
        search = f"%{q}%"
        query = query.filter((Opportunity.title.like(search)) | (Opportunity.description.like(search)) | (Opportunity.service_needed.like(search)))

    return query.order_by(Opportunity.created_at.desc()).all()

@router.get("/opportunities/nearby", response_model=list[OpportunityOut])
def list_nearby_opportunities(
    lat: float,
    lng: float,
    radius_km: float = 15.0,
    category_key: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Opportunity)
    if category_key:
        query = query.filter(Opportunity.category_key == category_key)

    # Basic bounding box to reduce DB load before precise Python filtering
    lat_degree_approx = radius_km / 111.0
    lng_degree_approx = radius_km / (111.0 * math.cos(math.radians(lat))) if math.cos(math.radians(lat)) != 0 else radius_km / 111.0

    query = query.filter(
        Opportunity.latitude >= lat - lat_degree_approx,
        Opportunity.latitude <= lat + lat_degree_approx,
        Opportunity.longitude >= lng - lng_degree_approx,
        Opportunity.longitude <= lng + lng_degree_approx
    )

    opportunities = query.order_by(Opportunity.created_at.desc()).all()

    return [
        opp for opp in opportunities
        if opp.latitude is not None and opp.longitude is not None and
        haversine_distance(lat, lng, opp.latitude, opp.longitude) <= radius_km
    ]

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

    profile = db.query(Profile).filter(Profile.id == opp.created_by_profile_id).first()
    require_verified_steward_or_platform_admin(profile)

    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        return opp

    with replay_transaction(db):
        for key, value in update_data.items():
            setattr(opp, key, value)

        event_type = "opportunity_amended"
        if "status" in update_data:
            if update_data["status"] == "contacted":
                event_type = "opportunity_contacted"
            elif update_data["status"] == "quoted":
                event_type = "opportunity_quoted"
            elif update_data["status"] == "closed":
                event_type = "opportunity_closed"

        event = emit_continuity_event(
            db,
            business_owner_id=opp.created_by_profile_id,
            business_category_key=opp.category_key,
            business_line=opp.service_needed,
            event_type=event_type,
            actor_type="business_owner",
            actor_id=opp.created_by_profile_id,
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
