import logging
from contextlib import contextmanager

from src.database import SessionLocal
from src.models.activation_event import ActivationEvent
from src.models.opportunity import Opportunity
from src.services.public_profiles import get_public_profiles
from src.services.geo_match import match_opportunity_to_profiles

logger = logging.getLogger(__name__)


# ---------------------------------------------------
# DB CONTEXT SAFETY LAYER
# ---------------------------------------------------

@contextmanager
def db_session():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("DB transaction failed: %s", str(e))
        raise
    finally:
        db.close()


# ---------------------------------------------------
# EVENT PERSISTENCE (SAFE)
# ---------------------------------------------------

def store_event(db, event_data: dict) -> ActivationEvent:
    event = ActivationEvent(
        event_type=event_data["event_type"],
        entity_id=event_data["entity_id"],
        latitude=(event_data.get("location") or {}).get("latitude"),
        longitude=(event_data.get("location") or {}).get("longitude"),
        payload=event_data.get("signals", {}),
    )

    db.add(event)
    db.flush()  # keep within transaction boundary (no commit here)

    return event


# ---------------------------------------------------
# RESULT STORAGE (TRACEABLE EVENT LOG)
# ---------------------------------------------------

def store_activation_result(db, result: dict):
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
# BUSINESS LOGIC: OPPORTUNITY CREATED
# ---------------------------------------------------

def handle_new_opportunity(db, event_record: ActivationEvent):
    opportunity = (
        db.query(Opportunity)
        .filter(Opportunity.id == event_record.entity_id)
        .first()
    )

    if not opportunity:
        logger.warning(
            "Opportunity not found for event: %s",
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
            "Failed processing opportunity match: %s",
            str(e),
        )


# ---------------------------------------------------
# FUTURE EXTENSION POINT
# ---------------------------------------------------

def handle_profile_activation(db, event_record: ActivationEvent):
    # Future: trigger opportunity recomputation, notifications, etc.
    logger.info(
        "Profile activation event received: %s",
        event_record.entity_id,
    )


# ---------------------------------------------------
# EVENT ROUTER (DISPATCHER)
# ---------------------------------------------------

def evaluate_event(db, event_record: ActivationEvent):
    handlers = {
        "opportunity_created": handle_new_opportunity,
        "profile_activated": handle_profile_activation,
    }

    handler = handlers.get(event_record.event_type)

    if not handler:
        logger.info(
            "No handler for event type: %s",
            event_record.event_type,
        )
        return

    handler(db, event_record)


# ---------------------------------------------------
# PUBLIC ENTRYPOINT (SAFE INGESTION)
# ---------------------------------------------------

def ingest_event(event_data: dict):
    """
    Entry point for all activation events.
    Fully transactional + safe + observable.
    """

    with db_session() as db:
        event_record = store_event(db, event_data)
        evaluate_event(db, event_record)
