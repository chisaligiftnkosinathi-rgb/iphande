from fastapi import HTTPException
from src.models.profile import Profile

def require_verified_steward(profile: Profile):
    """
    Enforces the R120 Verification Gate.
    Raises 403 Forbidden if the steward has not paid or not been approved.
    """
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if profile.setup_fee_status != "approved" or not profile.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Steward verification required. Please complete the R120 setup fee process."
        )
