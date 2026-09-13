from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.auth.supabase_auth import get_current_user
from src.schemas.bootstrap_schema import (
    BootstrapResponse, IdentitySchema, BusinessSchema, SystemSchema,
    ApplicationState, SetupState, SubscriptionState
)
from src.models.profile import Profile
from src.services.dashboard_service import DashboardService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Bootstrap"])

@router.get("/bootstrap", response_model=BootstrapResponse)
def get_bootstrap(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from src.config import BOOTSTRAP_ADMIN_EMAILS, SYSTEM_CREATOR_EMAIL
    from src.models.user import User

    uid = current_user.get("uid")
    email = (current_user.get("email") or "").lower()

    profile = db.query(Profile).filter((Profile.owner_id == uid) | (Profile.id == uid)).first()
    db_user = db.query(User).filter((User.id == uid) | (User.email == email)).first()
    
    # 1. Deterministic Role Resolution
    # SupaAdmin > Admin > Merchant > Buyer
    role = "buyer"
    if email and (email in [e.lower() for e in BOOTSTRAP_ADMIN_EMAILS] or email == SYSTEM_CREATOR_EMAIL):
        role = "supaadmin"
    elif profile and getattr(profile, "role", None) in ["supaadmin", "admin", "merchant", "buyer"]:
        role = profile.role
    elif db_user and getattr(db_user, "role", None) in ["supaadmin", "admin", "merchant", "buyer"]:
        role = db_user.role

    # Sync role to profile if it exists
    if profile and profile.role != role:
        profile.role = role
        db.commit()

    # Dashboard Service already handles missing profile gracefully
    dashboard_res = DashboardService.build_dashboard(db, uid)
    
    identity = IdentitySchema(
        id=str(profile.id) if profile else uid,
        email=email,
        emailVerified=True
    )

    businesses = []
    selected_business_id = None
    plan = getattr(profile, 'plan_code', None) or getattr(profile, 'plan', None) or "free"
    is_active = getattr(profile, 'is_active', False)

    if profile and role in ["merchant", "admin", "supaadmin"]:
        from src.models.merchant_account import MerchantAccount
        m_account = db.query(MerchantAccount).filter(MerchantAccount.user_id == uid).first()
        v_status = m_account.verification_status.value if m_account and hasattr(m_account.verification_status, 'value') else (str(m_account.verification_status) if m_account else "unverified")
        notes = m_account.kyc_review_notes if m_account else None
        payout_on = m_account.payout_enabled if m_account else False

        businesses.append(BusinessSchema(
            id=str(profile.id),
            slug=profile.slug or "",
            displayName=profile.name or profile.slug or "My Business",
            trust=100,
            plan=plan,
            status="active" if is_active else "inactive",
            permissions=[],
            featureFlags=[],
            verification_status=v_status,
            kyc_review_notes=notes,
            payout_enabled=payout_on
        ))
        selected_business_id = str(profile.id)

    # 2. Dynamic Role-Based Navigation Items
    navigation = []
    permissions = []
    feature_flags = []

    if role == "buyer":
        navigation = [
            {"id": "explore", "label": "Explore", "route": "/tabs/explore", "icon": "compass-outline"},
            {"id": "profile", "label": "Profile", "route": "/tabs/profile", "icon": "person-outline"}
        ]
        permissions = ["marketplace:browse", "order:create", "tracking:view"]
        feature_flags = ["show_open_storefront_card", "multi_carrier_shipping", "multi_gateway_checkout"]

    elif role == "merchant":
        navigation = [
            {"id": "home", "label": "Home", "route": "/tabs/home", "icon": "home-outline"},
            {"id": "explore", "label": "Explore", "route": "/tabs/explore", "icon": "compass-outline"},
            {"id": "leads", "label": "Leads", "route": "/tabs/leads", "icon": "mail-outline"},
            {"id": "manage", "label": "Manage", "route": "/tabs/manage", "icon": "grid-outline"},
            {"id": "profile", "label": "Profile", "route": "/tabs/profile", "icon": "person-outline"}
        ]
        permissions = ["product:create", "inventory:update", "order:fulfill", "payout:view"]
        feature_flags = ["merchant_erp_active", "inventory_management", "payout_history"]

    elif role in ["admin", "supaadmin"]:
        navigation = [
            {"id": "home", "label": "Home", "route": "/tabs/home", "icon": "home-outline"},
            {"id": "explore", "label": "Explore", "route": "/tabs/explore", "icon": "compass-outline"},
            {"id": "leads", "label": "Leads", "route": "/tabs/leads", "icon": "mail-outline"},
            {"id": "manage", "label": "Manage", "route": "/tabs/manage", "icon": "grid-outline"},
            {"id": "profile", "label": "Profile", "route": "/tabs/profile", "icon": "person-outline"}
        ]
        permissions = ["treasury:view", "treasury:settle", "moderation:approve", "policy:write"]
        feature_flags = ["supaadmin_console", "treasury_dashboard", "analytics_velocity"]

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
            completed=role != "buyer",
            current_step=5 if role != "buyer" else 1,
            total_steps=5
        ),
        subscription=SubscriptionState(status="active", plan=plan),
        workspace=None,
        businesses=businesses,
        selectedBusinessId=selected_business_id,
        permissions=permissions,
        featureFlags=feature_flags,
        navigation=navigation,
        platformRole=role,
        dashboard=dashboard_res,
        policy={},
        system=system
    )

