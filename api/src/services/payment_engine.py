import uuid
import logging
from sqlalchemy.orm import Session

from src.models.payment_event import PaymentEvent

logger = logging.getLogger(__name__)


# ---------------------------------------------------
# PAYMENT PROCESSOR (STATE EVENT GENERATOR)
# ---------------------------------------------------

def process_payment_event(db: Session, user, trigger: dict):
    """
    Converts payment request into persistent payment event.

    RULES:
    - Must be idempotent-safe (future enhancement hook)
    - Must validate input
    - Must always create traceable event
    """

    amount = trigger.get("amount", 0)
    provider = trigger.get("provider", "manual")

    # ---------------------------------------------------
    # VALIDATION LAYER
    # ---------------------------------------------------

    if amount <= 0:
        raise ValueError("Payment amount must be greater than 0")

    # ---------------------------------------------------
    # EVENT CREATION
    # ---------------------------------------------------

    payment = PaymentEvent(
        id=str(uuid.uuid4()),
        user_id=user.id,
        amount=amount,
        status="successful",  # future: pending → confirmed flow
        provider=provider,
        payload={
            "trigger_source": trigger.get("source", "api"),
        },
    )

    db.add(payment)
    db.flush()

    # ---------------------------------------------------
    # TRACE LOG (IMPORTANT FOR PRODUCTION DEBUGGING)
    # ---------------------------------------------------

    logger.info(
        "Payment processed",
        extra={
            "payment_id": payment.id,
            "user_id": user.id,
            "amount": amount,
            "provider": provider,
        },
    )

    # ---------------------------------------------------
    # RETURN CONTRACT (USED BY LIFECYCLE ENGINE)
    # ---------------------------------------------------

    return {
        "payment_id": payment.id,
        "user_id": user.id,
        "amount": payment.amount,
        "status": payment.status,
        "provider": payment.provider,
        "traceable": True,
    }
