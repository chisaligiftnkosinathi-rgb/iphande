from datetime import datetime
from sqlalchemy.orm import Session

from src.models import User
from src.services.activation_engine import evaluate_activation
from src.services.payment_engine import get_user_payment_state


def build_me_state(db: Session, user: User):
    """
    SINGLE SOURCE OF TRUTH:
    Computes real-time user state from all engines.
    """

    # 1. PAYMENT LAYER
    payment_state = get_user_payment_state(db, user.id)
    is_paid = payment_state.get("is_paid", False)

    # 2. ACTIVATION LAYER
    user.is_paid = is_paid
    activation_level = evaluate_activation(user)

    # 3. DERIVED SYSTEM STATE
    activation_status = (
        "UNPAID" if not is_paid
        else "AWAITING_ACTIVATION" if activation_level.startswith("LEVEL_2")
        else "ACTIVE"
    )

    access_level = activation_level

    # 4. RETURN CANONICAL STATE
    return {
        "identity": {
            "user_id": str(user.id),
            "name": user.name,
            "email": user.email,
            "phone": getattr(user, "phone", None),
        },

        "platform_access": {
            "platform_identity": "STEWARD",
            "access_level": access_level,
            "activation_status": activation_status,
        },

        "activation_snapshot": {
            "is_paid": is_paid,
            "activation_level": activation_level,
            "computed_at": datetime.utcnow().isoformat(),
        }
    }
