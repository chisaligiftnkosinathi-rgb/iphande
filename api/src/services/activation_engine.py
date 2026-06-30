import logging
from sqlalchemy.orm import Session

from src.models.activation_event import ActivationEvent
from src.models.opportunity import Opportunity
from src.services.public_profiles import get_public_profiles
from src.services.geo_match import match_opportunity_to_profiles

logger = logging.getLogger(__name__)


# ---------------------------------------------------
# EVENT STORAGE (NO COMMIT - TRANSACTION SAFE)
# ---------------------------------------------------

def store_event(db: Session, event_data: dict) -> ActivationEvent:
    event = ActivationEvent(
        event_type=event_data["event_type"],
        entity_id=event_data["entity_id"],
        latitude=(event_data.get("location") or {}).get("latitude"),
        longitude=(event_data.get("location") or {}).get("longitude"),
        payload=event_data.get("signals", {}),
    )

    db.add(event)
    db.flush()  # safe inside transaction boundary
    return event


# ---------------------------------------------------
# RESULT STORAGE (TRACEABLE OUTPUT)
# ---------------------------------------------------

def store_activation_result(db: Session, result: dict):
    event = ActivationEvent(
        event_type="geo_match_computed",
        entity_id=str(result["opportunity_id"]),
        payload={
            "top_matches": result["top_matches"],
            "match_count": len(result["top_matches"]),
        },
    )

    db.add(event)
    db.flush()


# ---------------------------------------------------
# OPPORTUNITY ACTIVATION LOGIC
# ---------------------------------------------------

def handle_new_opportunity(db: Session, event_record: ActivationEvent):
    opportunity = (
        db.query(Opportunity)
        .filter(Opportunity.id == event_record.entity_id)
        .first()
    )

    if not opportunity:
        logger.warning(
            "Opportunity not found: %s",
            event_record.entity_id,
        )
        return

    try:
        profiles = get_public_profiles(db)
        matches = match_opportunity_to_profiles(opportunity, profiles)

        top_matches = matches[:5]

        store_activation_result(
            db,
            {
                "opportunity_id": opportunity.id,
                "top_matches": top_matches,
            },
        )

    except Exception as e:
        logger.exception(
            "Opportunity activation failed: %s",
            str(e),
        )


# ---------------------------------------------------
# PROFILE ACTIVATION LOGIC (FUTURE EXTENSION POINT)
# ---------------------------------------------------

def handle_profile_activation(db: Session, event_record: ActivationEvent):
    logger.info(
        "Profile activation event received: %s",
        event_record.entity_id,
    )


# ---------------------------------------------------
# EVENT ROUTER (SINGLE RESPONSIBILITY)
# ---------------------------------------------------

def evaluate_event(db: Session, event_record: ActivationEvent):
    router = {
        "opportunity_created": handle_new_opportunity,
        "profile_activated": handle_profile_activation,
    }

    handler = router.get(event_record.event_type)

    if not handler:
        logger.info(
            "Unhandled event type: %s",
            event_record.event_type,
        )
        return

    handler(db, event_record)


# ---------------------------------------------------
# PUBLIC ENTRYPOINT (NO SESSION CREATED HERE)
# ---------------------------------------------------

def ingest_event(db: Session, event_data: dict):
    """
    Entry point for activation engine.

    RULES:
    - NO SessionLocal here
    - NO commit here
    - MUST be controlled by lifecycle engine
    """

    event_record = store_event(db, event_data)
    evaluate_event(db, event_record)
