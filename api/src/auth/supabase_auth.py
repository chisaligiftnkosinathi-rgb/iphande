from fastapi import Header, HTTPException
import jwt
from src.config import SUPABASE_JWT_SECRET

async def get_current_firebase_user(authorization: str | None = Header(default=None)):
    """
    Validates the Supabase JWT.
    (Function name preserved for compatibility).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]

    if not SUPABASE_JWT_SECRET:
        # Failsafe if secret is not set, meaning server misconfigured.
        raise HTTPException(status_code=500, detail="JWT secret not configured")

    try:
        # Supabase uses HS256 algorithm by default
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False} # Audiences differ per project
        )
        
        uid = payload.get("sub")
        email = payload.get("email")

        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        return {
            "uid": uid,
            "sub": uid,
            "email": email,
            "is_mock": False,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
