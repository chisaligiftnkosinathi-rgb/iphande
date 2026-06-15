from fastapi import HTTPException
from src.models.profile import Profile

def require_verified_steward_or_platform_admin(profile: Profile):
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    is_platform_admin = (
        profile.trust_posture == "system_creator"
        or profile.role in ("admin", "system_admin")
    )

    is_verified_steward = (
        profile.is_verified is True
        and profile.setup_fee_status == "approved"
    )

    if is_platform_admin or is_verified_steward:
        return profile

    raise HTTPException(
        status_code=403,
        detail="Steward verification required. Please complete the R120 setup fee process.",
    )

def require_admin(profile: Profile):
    if not profile:
        raise HTTPException(status_code=401, detail="Authentication required")
    if getattr(profile, "role", "steward") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
