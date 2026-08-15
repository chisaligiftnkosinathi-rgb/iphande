from fastapi import HTTPException
from src.models.profile import Profile
from sqlalchemy.orm import Session

def require_verified_steward_or_platform_admin(profile: Profile):
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    is_platform_admin = (
        getattr(profile, "trust_posture", None) == "system_creator"
        or getattr(profile, "role", None) in ("admin", "system_admin")
    )

    is_verified_steward = (
        getattr(profile, "is_verified", False) is True
        and getattr(profile, "setup_fee_status", None) == "approved"
    )

    if is_platform_admin or is_verified_steward:
        return profile

    raise HTTPException(
        status_code=403,
        detail="Steward verification required. Please complete the R120 setup fee process.",
    )

def verify_tenant_access(db: Session, current_user: dict, target_profile_id: str):
    uid = current_user.get("uid")
    is_service = current_user.get("is_service")
    
    # Resolve target_profile_id if it's a Global IT tenant ID
    from src.models.tenant_mapping import TenantIdentityMapping
    mapping = db.query(TenantIdentityMapping).filter(TenantIdentityMapping.global_it_tenant_id == target_profile_id).first()
    resolved_target = mapping.iphande_profile_id if mapping else target_profile_id
    
    if is_service:
        profile = db.query(Profile).filter(Profile.id == uid).first()
    else:
        profile = db.query(Profile).filter(Profile.owner_id == uid).first()
        
    if not profile or str(profile.id) != str(resolved_target):
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")
    require_verified_steward_or_platform_admin(profile)
    return profile

def require_admin(profile: Profile):
    if not profile:
        raise HTTPException(status_code=401, detail="Authentication required")
    if getattr(profile, "role", "steward") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
