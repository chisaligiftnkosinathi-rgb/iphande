from src.services.activation_engine import evaluate_activation
from src.services.payment_engine import process_payment_event
from src.services.lifecycle_consistency import build_user_state_snapshot


# ---------------------------------------------------
# SINGLE LIFECYCLE ORCHESTRATOR
# ---------------------------------------------------

def run_lifecycle(db, user, trigger: dict):
    """
    CENTRAL TRUTH ENGINE

    This is the ONLY place where:
    - payment
    - activation
    - state snapshot
    come together
    """

    event_type = trigger.get("type")

    payment_result = None
    activation_result = None

    # ---------------------------------------------------
    # PAYMENT FLOW
    # ---------------------------------------------------

    if event_type == "payment":
        payment_result = process_payment_event(db, user, trigger)

    # ---------------------------------------------------
    # ACTIVATION FLOW
    # ---------------------------------------------------

    activation_result = evaluate_activation(user)

    user.access_level = activation_result
    db.flush()

    # ---------------------------------------------------
    # FINAL SNAPSHOT (CONSISTENCY CONTRACT)
    # ---------------------------------------------------

    return build_user_state_snapshot(
        user=user,
        activation_result={"level": activation_result},
        payment_result=payment_result
    )
