from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.geo_match import match_opportunity_to_profiles
from src.services.public_profiles import get_public_profiles
from src.models.opportunity import Opportunity

router = APIRouter(prefix="/match", tags=["Geo Match"])

from src.services.demand_engine import DemandEngine
from src.services.signal_aggregator import build_signals_from_context

@router.get("/opportunity/{opportunity_id}")
def match_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    profiles = get_public_profiles(db)
    matches = match_opportunity_to_profiles(opportunity, profiles)

    # Enhance match with future demand and availability
    demand_engine = DemandEngine()
    signals = build_signals_from_context(getattr(opportunity, 'latitude', 0.0), getattr(opportunity, 'longitude', 0.0))
    
    mock_geo_cell = f"cell_{round(getattr(opportunity, 'latitude', 0.0), 2)}_{round(getattr(opportunity, 'longitude', 0.0), 2)}"

    from src.services.availability_engine import availability_engine
    from src.services.fraud.fraud_detector import fraud_detector

    for match in matches:
        # 0. FRAUD GATE: Protect the matching pool
        if fraud_detector.is_suspicious(match["profile_id"]):
            continue # Exclude bad actors from matching entirely

        demand = demand_engine.compute_demand_score(
            signals,
            match["archetype"] or "general",
            mock_geo_cell
        )

        availability = availability_engine.compute(match["profile_id"])

        # Boost score by future demand logic
        match_score = (match["match_score"] * 0.7) + (demand["demand_score"] * 0.3)
        
        # Penalize if not available
        if availability["availability_status"] != "available":
            match_score = match_score * 0.5
            match["reasons"].append("availability_penalty")
        else:
            match["reasons"].append("availability_boost")

        match["match_score"] = round(match_score, 2)
        match["reasons"].append("future_demand_boost")

    # Re-sort since match scores changed
    matches = sorted(matches, key=lambda x: x["match_score"], reverse=True)

    # Publish match computed event
    from src.services.demand_pubsub import demand_pubsub
    demand_pubsub.publish(
        channel="match.events",
        event_type="match_computed",
        entity_type="opportunity",
        entity_id=opportunity_id,
        geo_data={
            "lat": getattr(opportunity, 'latitude', 0.0),
            "lng": getattr(opportunity, 'longitude', 0.0),
            "cell": mock_geo_cell
        },
        payload={"total_matches": len(matches), "top_score": matches[0]["match_score"] if matches else 0},
        source="geo_match"
    )

    return {
        "opportunity_id": opportunity_id,
        "matches": matches
    }
