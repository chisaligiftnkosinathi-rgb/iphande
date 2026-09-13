import logging
from sqlalchemy.orm import Session
from src.domain.business_state_rules import validate_transition
from src.services.continuity_event_service import emit_continuity_event

logger = logging.getLogger(__name__)

def audit_transition(
    db: Session,
    business_owner_id: str,
    entity_type: str,
    entity_id: str,
    current_state: str,
    next_state: str,
    actor_type: str = "system",
    actor_id: str = "system"
):
    # 1. Record Attempt before any mutation occurs
    logger.info(
        f"State transition attempted: {entity_type} {entity_id} from {current_state} to {next_state}",
        extra={
            "event": "state_transition_attempted",
            "business_owner_id": business_owner_id,
            "user_id": actor_id,
            "resource_type": entity_type.lower(),
            "resource_id": entity_id,
            "state_before": current_state,
            "state_after": next_state,
            "outcome": "attempted"
        }
    )
    
    emit_continuity_event(
        db,
        business_owner_id=business_owner_id,
        business_category_key=None,
        business_line=None,
        event_type="state_transition_attempted",
        actor_type=actor_type, actor_id=actor_id,
        related_entity_type=entity_type.lower(), related_entity_id=entity_id,
        payload={"from_state": current_state, "to_state": next_state},
        auto_commit=True
    )

    try:
        # Evaluate pure business rules
        validate_transition(entity_type, current_state, next_state)
    except ValueError as e:
        # 2. Record Rejection
        logger.warning(
            f"State transition rejected: {entity_type} {entity_id} - {str(e)}",
            extra={
                "event": "state_transition_rejected",
                "business_owner_id": business_owner_id,
                "user_id": actor_id,
                "resource_type": entity_type.lower(),
                "resource_id": entity_id,
                "state_before": current_state,
                "state_after": next_state,
                "outcome": "rejected",
                "payload": {"reason": str(e)},
                "allowed_payload_keys": ["reason"]
            }
        )
        
        emit_continuity_event(
            db,
            business_owner_id=business_owner_id,
            business_category_key=None,
            business_line=None,
            event_type="state_transition_rejected",
            actor_type=actor_type, actor_id=actor_id,
            related_entity_type=entity_type.lower(), related_entity_id=entity_id,
            payload={"from_state": current_state, "to_state": next_state, "reason": str(e)},
            auto_commit=True
        )
        raise e

    # 3. Record Application (wait for the main transaction)
    logger.info(
        f"State transition applied: {entity_type} {entity_id} from {current_state} to {next_state}",
        extra={
            "event": "state_transition_applied",
            "business_owner_id": business_owner_id,
            "user_id": actor_id,
            "resource_type": entity_type.lower(),
            "resource_id": entity_id,
            "state_before": current_state,
            "state_after": next_state,
            "outcome": "applied"
        }
    )
    
    emit_continuity_event(
        db,
        business_owner_id=business_owner_id,
        business_category_key=None,
        business_line=None,
        event_type="state_transition_applied",
        actor_type=actor_type, actor_id=actor_id,
        related_entity_type=entity_type.lower(), related_entity_id=entity_id,
        payload={"from_state": current_state, "to_state": next_state},
        auto_commit=False
    )
