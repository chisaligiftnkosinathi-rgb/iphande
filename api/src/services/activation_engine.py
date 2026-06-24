import json
import logging
from src.database import SessionLocal
from src.models.activation_event import ActivationEvent
from src.models.opportunity import Opportunity
from src.services.public_profiles import get_public_profiles
from src.services.geo_match import match_opportunity_to_profiles

logger = logging.getLogger(__name__)

def store_event(db, event_data: dict) -> ActivationEvent:
    event = ActivationEvent(
        event_type=event_data["event_type"],
        entity_id=event_data["entity_id"],
        latitude=event_data.get("location", {}).get("latitude"),
        longitude=event_data.get("location", {}).get("longitude"),
        payload=event_data.get("signals", {})
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def store_activation_result(db, result: dict):
    # This could be stored in a dedicated matches/results table later.
    # For now, we serialize it as an event back into activation_events for traceability.
    event = ActivationEvent(
        event_type="geo_match_computed",
        entity_id=str(result["opportunity_id"]),
        payload={"top_matches": result["top_matches"]}
    )
    db.add(event)
    db.commit()

def handle_new_opportunity(db, event_record: ActivationEvent):
    opportunity = db.query(Opportunity).filter(Opportunity.id == event_record.entity_id).first()
    if not opportunity:
        logger.warning(f"Opportunity {event_record.entity_id} not found for activation event.")
        return

    profiles = get_public_profiles(db)
    matches = match_opportunity_to_profiles(opportunity, profiles)
    
    # Take top 5
    top_matches = matches[:5]
    
    store_activation_result(db, {
        "opportunity_id": opportunity.id,
        "top_matches": top_matches
    })

def handle_profile_activation(db, event_record: ActivationEvent):
    # In the future: find matching opportunities and notify the user
    pass

def evaluate_event(db, event_record: ActivationEvent):
    if event_record.event_type == "opportunity_created":
        handle_new_opportunity(db, event_record)
    elif event_record.event_type == "profile_activated":
        handle_profile_activation(db, event_record)

def ingest_event(event_data: dict):
    db = SessionLocal()
    try:
        event_record = store_event(db, event_data)
        evaluate_event(db, event_record)
    finally:
        db.close()
