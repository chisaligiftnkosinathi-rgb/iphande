from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.schemas.user_schema import UserCreate, UserLogin, Token
from src.core.security import create_access_token, get_password_hash, verify_password
from src.services.continuity_event_service import emit_continuity_event
from src.core.rate_limit import limiter

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
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

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
        payload={"email": db_user.email},
        auto_commit=True
    )

    # Issue token
    token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer"}


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

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
