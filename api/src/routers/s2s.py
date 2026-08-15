from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db, replay_transaction
from src.models.profile import Profile
from src.models.tenant_mapping import TenantIdentityMapping
from src.auth.supabase_auth import get_current_user, get_s2s_identity
import uuid

router = APIRouter(prefix="/api/v1/s2s", tags=["s2s"])

@router.post("/tenant-bootstrap")
def bootstrap_s2s_tenant(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_s2s_identity)
):
    """
    Idempotently ensures that a Global IT tenant has an associated iPhande Profile.
    This endpoint MUST be called with a valid S2S JWT.
    """
    if not current_user.get("is_service"):
        raise HTTPException(status_code=403, detail="Endpoint restricted to S2S tokens")
    
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant_id in S2S token")
        
    # Check if mapping already exists
    mapping = db.query(TenantIdentityMapping).filter(
        TenantIdentityMapping.global_it_tenant_id == tenant_id
    ).first()
    
    if mapping:
        profile = db.query(Profile).filter(Profile.id == mapping.iphande_profile_id).first()
        if not profile:
            raise HTTPException(status_code=500, detail="Mapping exists but profile not found")
        return {"status": "ok", "action": "existing", "profile_id": profile.id}
        
    # Idempotent creation
    with replay_transaction(db):
        profile_id = str(uuid.uuid4())
        
        # Create profile. We don't set owner_id because this is not a Supabase user.
        # Generate a placeholder email based on the tenant ID
        safe_email = tenant_id if "@" in tenant_id else f"{tenant_id}@s2s.globalitbusiness.co.za"

        new_profile = Profile(
            id=profile_id,
            name=f"Global IT Tenant {tenant_id[:8]}",
            slug=f"global-it-{uuid.uuid4().hex[:8]}",
            email=safe_email,
            is_verified=True,
            is_active=True,
            onboarding_completed=True,
            setup_fee_status="approved",
            role="steward"
        )
        db.add(new_profile)
        
        new_mapping = TenantIdentityMapping(
            global_it_tenant_id=tenant_id,
            iphande_profile_id=profile_id
        )
        db.add(new_mapping)
        
        db.flush()
        db.refresh(new_profile)
        
    return {"status": "ok", "action": "created", "profile_id": new_profile.id}
