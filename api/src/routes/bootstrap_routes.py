from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.supabase_auth import get_current_user
from src.schemas.bootstrap_schema import BootstrapResponse, IdentitySchema, BusinessSchema, SystemSchema
from src.models.profile import Profile
from src.services.dashboard_service import DashboardService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Bootstrap"])

@router.get("/bootstrap", response_model=BootstrapResponse)
def get_bootstrap(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    email = current_user.get("email")

    profile = db.query(Profile).filter(Profile.owner_id == uid).first()
    
    # Dashboard Service already handles missing profile gracefully via empty structure or errors
    dashboard_res = DashboardService.build_dashboard(db, uid)
    
    identity = IdentitySchema(
        id=str(profile.id) if profile else uid,
        email=email,
        emailVerified=True
    )

    businesses = []
    selected_business_id = None
    if profile:
        businesses.append(BusinessSchema(
            id=str(profile.id),
            slug=profile.slug or "",
            displayName=profile.name or profile.slug or "",
            trust=100,
            plan=profile.plan_code or "free",
            status="active" if profile.is_active else "inactive",
            permissions=[],
            featureFlags=[]
        ))
        selected_business_id = str(profile.id)

    system = SystemSchema(
        version="1.0.0",
        environment="production",
        maintenance=False
    )

    return BootstrapResponse(
        session={},
        identity=identity,
        business={},
        application=ApplicationState(stage="growth"),
        setup=SetupState(
            exists=profile is not None,
            completed=False,
            current_step=1,
            total_steps=5
        ),
        subscription=SubscriptionState(status="active", plan=profile.plan_code if profile else "free"),
        workspace=None, # For now, return None or mock to prevent crashing
        businesses=businesses,
        selectedBusinessId=selected_business_id,
        permissions=[],
        featureFlags=[],
        navigation=[],
        platformRole=profile.role if profile and hasattr(profile, 'role') else "steward",
        dashboard=dashboard_res,
        policy={},
        system=system
    )
