from datetime import datetime


# ---------------------------------------------------
# SINGLE SOURCE OF USER STATE TRUTH
# ---------------------------------------------------

def build_user_state_snapshot(user, activation_result=None, payment_result=None):
    """
    EVERYTHING about user state MUST pass through here.

    This is the CONSISTENCY CONTRACT.
    """

    return {
        "user_id": user.id,

        "identity": {
            "name": user.name,
            "email": user.email,
        },

        "payment_state": {
            "is_paid": getattr(user, "is_paid", False),
            "last_payment_id": getattr(payment_result, "payment_id", None)
            if payment_result else None,
        },

        "activation_state": {
            "access_level": user.access_level,
            "activation_source": (
                activation_result.get("source")
                if activation_result else "system"
            ),
        },

        "system_meta": {
            "generated_at": datetime.utcnow().isoformat(),
            "version": "v1-consistency-contract"
        }
    }
