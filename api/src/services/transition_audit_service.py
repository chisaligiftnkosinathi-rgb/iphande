from sqlalchemy.orm import Session
from src.domain.business_state_rules import validate_transition
from src.services.continuity_event_service import emit_continuity_event

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
