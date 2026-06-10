import os
import jwt
from jwt import PyJWKClient
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

_jwks_client = None

def get_jwks_client():
    global _jwks_client
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured")
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
    return _jwks_client

# Note: The function name is temporarily kept as 'get_current_firebase_user'
# so it doesn't break dependencies in other existing routing files.
def get_current_firebase_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    token = credentials.credentials

    print("AUTH HEADER OK")
    print("TOKEN RECEIVED:", token[:30], "...")

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg == "HS256":
            if not SUPABASE_JWT_SECRET:
                raise RuntimeError("SUPABASE_JWT_SECRET is not configured")
            decoded = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            signing_key = get_jwks_client().get_signing_key_from_jwt(token)
            decoded = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )

        print("JWT CLAIMS KEYS:", decoded.keys())
        print("JWT SUB:", decoded.get("sub"))
        print("JWT EMAIL:", decoded.get("email"))
        print("JWT ISS:", decoded.get("iss"))
        print("JWT AUD:", decoded.get("aud"))

        return {
            "uid": decoded.get("uid") or decoded.get("sub"),
            "email": decoded.get("email"),
            **decoded,
        }

    except Exception as e:
        print("SUPABASE VERIFY ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase token",
        )
