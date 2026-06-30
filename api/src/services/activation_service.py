from src.services.activation_engine import evaluate_activation
from datetime import datetime


# ---------------------------------------------------
# APPLY ACTIVATION TO USER (STATE MUTATOR ONLY)
# ---------------------------------------------------

def apply_user_activation(db, user):
    """
    Applies activation engine decision to user state.

    RULE:
    - NEVER decides logic
    - ONLY applies engine output
    """

    new_level = evaluate_activation(user)
    old_level = getattr(user, "access_level", None)

    # ---------------------------------------------------
    # NO-OP SAFETY (IMPORTANT FOR PRODUCTION)
    # ---------------------------------------------------

    if new_level == old_level:
        return {
            "changed": False,
            "level": old_level
        }

    # ---------------------------------------------------
    # APPLY STATE CHANGE
    # ---------------------------------------------------

    user.access_level = new_level
    user.updated_at = datetime.utcnow()

    # flush ONLY when change occurs
    db.flush()

    return {
        "changed": True,
        "old_level": old_level,
        "new_level": new_level
    }
