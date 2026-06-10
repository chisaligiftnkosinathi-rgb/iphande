import os
import jwt
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

# Note: The function name is temporarily kept as 'get_current_firebase_user'
# so it doesn't break dependencies in other existing routing files.
def get_current_firebase_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    if not SUPABASE_JWT_SECRET:
        raise RuntimeError("SUPABASE_JWT_SECRET is not configured")

    token = credentials.credentials

    try:
        decoded = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )

        return {
            "uid": decoded.get("sub"),
            "email": decoded.get("email"),
            **decoded,
        }

    except Exception as e:
        print("SUPABASE VERIFY ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase token",
        )
