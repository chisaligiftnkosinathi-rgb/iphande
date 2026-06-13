import os
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

_jwks_client = None

def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured on the server")
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
    return _jwks_client


async def get_current_firebase_user(authorization: str | None = Header(default=None)):
    """
    Validates the Supabase JWT.
    Supports ES256 (ECDSA via JWKS) and HS256 (symmetric secret).
    Function name preserved for backward compatibility with existing routers.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        print(f"AUTH: alg={alg}, kid={header.get('kid')}")

        if alg == "HS256":
            if not SUPABASE_JWT_SECRET:
                raise HTTPException(status_code=500, detail="JWT secret not configured on server")
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # ES256 / RS256 — use JWKS public key fetched from Supabase
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )

        uid = payload.get("sub")
        email = payload.get("email")

        print(f"AUTH OK: uid={uid} email={email}")

        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing sub")

        return {
            "uid": uid,
            "sub": uid,
            "email": email,
            "is_mock": False,
        }

    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        print(f"AUTH FAIL (InvalidTokenError): {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        print(f"AUTH FAIL (unexpected): {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
