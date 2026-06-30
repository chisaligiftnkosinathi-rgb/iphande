from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.core.security import get_current_user

from src.services.lifecycle_engine import run_lifecycle

router = APIRouter(prefix="/api/v1", tags=["Me"])


# ---------------------------------------------------
# AUTHENTICATED SYSTEM STATE
# ---------------------------------------------------

@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """
    AUTHENTICATED SINGLE USER TRUTH VIEW
    """

    snapshot = run_lifecycle(
        db=db,
        user=user,
        trigger={"type": "noop"}
    )

    return {
        "identity": {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": getattr(user, "phone", None),
        },

        "platform_access": {
            "platform_identity": "STEWARD",
            "access_level": user.access_level,
            "activation_status": (
                "UNPAID" if not getattr(user, "is_paid", False)
                else "ACTIVE"
            ),
        },

        "business_reality": {
            "lineage": getattr(user, "lineage", None),
            "archetype": getattr(user, "archetype", None),
            "category": getattr(user, "category", None),
        },

        "activation_snapshot": snapshot,
    }
