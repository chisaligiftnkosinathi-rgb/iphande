from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.schemas.user_schema import UserCreate, UserLogin, Token, MerchantUpgradeRequest, RolePromoteRequest
from src.core.security import create_access_token, get_password_hash, verify_password
from src.services.continuity_event_service import emit_continuity_event
from src.core.rate_limit import limiter
from src.auth.supabase_auth import get_current_user, require_supaadmin

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register", response_model=Token)
@limiter.limit("5/minute")
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    # Check email uniqueness
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    # Create new user
    role = "merchant" if user_data.role in ["merchant", "steward"] else "buyer"
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    profile_id = None
    if role == "merchant":
        import uuid
        import re
        from src.models.profile import Profile, BusinessType

        # Generate slug
        base_name = user_data.business_name or user_data.email.split("@")[0]
        slug_clean = re.sub(r'[^a-zA-Z0-9]', '-', base_name.lower()).strip('-')
        unique_slug = f"{slug_clean}-{uuid.uuid4().hex[:4]}"

        # Parse business type
        b_type = BusinessType.service
        if user_data.business_type and user_data.business_type in [b.value for b in BusinessType]:
            b_type = BusinessType(user_data.business_type)

        merchant_profile = Profile(
            id=str(uuid.uuid4()),
            name=user_data.business_name or f"Merchant ({user_data.email.split('@')[0]})",
            slug=unique_slug,
            email=user_data.email,
            owner_id=str(db_user.id),
            business_type=b_type,
            role="merchant",
            plan_code="starter",
            is_public=True,
            city=user_data.city,
            province=user_data.province
        )
        db.add(merchant_profile)
        db.commit()
        db.refresh(merchant_profile)
        profile_id = str(merchant_profile.id)

    # Emit audit event
    emit_continuity_event(
        db,
        business_owner_id=db_user.id,
        business_category_key=None,
        business_line=None,
        event_type="user_registered",
        actor_type="user",
        actor_id=db_user.id,
        related_entity_type="user",
        related_entity_id=db_user.id,
        parent_event_id=None,
        payload={"email": db_user.email, "role": role},
        auto_commit=True
    )

    # Issue token with role claim
    token = create_access_token(data={"sub": str(db_user.id), "role": role, "email": db_user.email})
    return {"access_token": token, "token_type": "bearer", "role": role, "profile_id": profile_id}


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        # Emit failure audit event
        emit_continuity_event(
            db,
            business_owner_id="system",
            business_category_key=None,
            business_line=None,
            event_type="user_login_failed",
            actor_type="system",
            actor_id="system",
            related_entity_type="user",
            related_entity_id="unknown",
            parent_event_id=None,
            payload={"email": user_data.email},
            auto_commit=True
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Determine user role and profile
    from src.models.profile import Profile
    profile = db.query(Profile).filter(Profile.owner_id == str(user.id)).first()
    role = getattr(user, "role", None) or (getattr(profile, "role", "merchant") if profile else "buyer")

    token = create_access_token(data={"sub": str(user.id), "role": role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": role,
        "profile_id": str(profile.id) if profile else None
    }


@router.post("/upgrade-to-merchant", response_model=Token)
def upgrade_to_merchant(
    upgrade_data: MerchantUpgradeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Allows an authenticated Buyer to self-upgrade into a Merchant.
    Provisions a merchant Profile, links owner_id, and issues an upgraded JWT.
    """
    user_id = current_user.get("uid")
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User account not found")

    from src.models.profile import Profile, BusinessType
    import uuid
    import re

    existing_profile = db.query(Profile).filter(Profile.owner_id == str(db_user.id)).first()
    if existing_profile:
        # User already has a merchant profile
        db_user.role = "merchant"
        db.commit()
        token = create_access_token(data={"sub": str(db_user.id), "role": "merchant", "email": db_user.email})
        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "merchant",
            "profile_id": str(existing_profile.id)
        }

    # Generate unique slug
    base_name = upgrade_data.business_name or db_user.email.split("@")[0]
    slug_clean = re.sub(r'[^a-zA-Z0-9]', '-', base_name.lower()).strip('-')
    unique_slug = f"{slug_clean}-{uuid.uuid4().hex[:4]}"

    b_type = BusinessType.service
    if upgrade_data.business_type and upgrade_data.business_type in [b.value for b in BusinessType]:
        b_type = BusinessType(upgrade_data.business_type)

    merchant_profile = Profile(
        id=str(uuid.uuid4()),
        name=upgrade_data.business_name,
        slug=unique_slug,
        email=db_user.email,
        owner_id=str(db_user.id),
        business_type=b_type,
        role="merchant",
        plan_code="starter",
        is_public=True,
        city=upgrade_data.city,
        province=upgrade_data.province
    )
    db_user.role = "merchant"
    db.add(merchant_profile)
    db.commit()
    db.refresh(merchant_profile)

    emit_continuity_event(
        db,
        business_owner_id=db_user.id,
        business_category_key=None,
        business_line=None,
        event_type="user_upgraded_to_merchant",
        actor_type="user",
        actor_id=db_user.id,
        related_entity_type="profile",
        related_entity_id=merchant_profile.id,
        parent_event_id=None,
        payload={"email": db_user.email, "role": "merchant", "profile_id": merchant_profile.id},
        auto_commit=True
    )

    token = create_access_token(data={"sub": str(db_user.id), "role": "merchant", "email": db_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "merchant",
        "profile_id": str(merchant_profile.id)
    }


@router.post("/promote-role")
def promote_user_role(
    req: RolePromoteRequest,
    db: Session = Depends(get_db),
    admin_context: dict = Depends(require_supaadmin)
):
    """
    SupaAdmin exclusive authority: Promote or demote any user to merchant, admin, or supaadmin.
    """
    valid_roles = ["buyer", "merchant", "admin", "supaadmin"]
    if req.new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role '{req.new_role}'. Must be one of: {valid_roles}")

    target_user = db.query(User).filter(User.id == req.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    target_user.role = req.new_role
    db.commit()

    emit_continuity_event(
        db,
        business_owner_id="system",
        business_category_key=None,
        business_line=None,
        event_type="role_promoted",
        actor_type="supaadmin",
        actor_id=admin_context.get("uid"),
        related_entity_type="user",
        related_entity_id=target_user.id,
        parent_event_id=None,
        payload={"user_id": target_user.id, "new_role": req.new_role, "promoted_by": admin_context.get("email")},
        auto_commit=True
    )

    return {
        "status": "success",
        "user_id": target_user.id,
        "email": target_user.email,
        "new_role": req.new_role
    }

