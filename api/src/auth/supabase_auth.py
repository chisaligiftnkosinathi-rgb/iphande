import os
from dotenv import load_dotenv
load_dotenv()
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.tenant_mapping import TenantIdentityMapping

from src.config import settings
import json

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
try:
    GLOBAL_IT_PUBLIC_KEYS = json.loads(settings.GLOBAL_IT_PUBLIC_KEYS)
except (ValueError, TypeError):
    GLOBAL_IT_PUBLIC_KEYS = {}

_jwks_client = None

def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured on the server")
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
    return _jwks_client


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Validates the Supabase JWT or the Global IT S2S JWT.
    Supports ES256 (ECDSA via JWKS), HS256 (symmetric secret), and RS256 (S2S).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        header = jwt.get_unverified_header(token)
        payload_unverified = jwt.decode(token, options={"verify_signature": False})
        iss = payload_unverified.get("iss")

        # 1. Global IT S2S Authentication
        if iss == "global-it":
            if not GLOBAL_IT_PUBLIC_KEYS:
                raise HTTPException(status_code=500, detail="GLOBAL_IT_PUBLIC_KEYS not configured on server")
            
            kid = header.get("kid", "v1")  # Default to v1 if no kid provided
            public_key = GLOBAL_IT_PUBLIC_KEYS.get(kid)
            if not public_key:
                raise HTTPException(status_code=401, detail=f"Unknown key ID: {kid}")
                
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                issuer="global-it",
                audience="iphande"
            )
            
            tenant_id = payload.get("tenant_id")
            if not tenant_id:
                raise HTTPException(status_code=401, detail="Invalid token payload: missing tenant_id")

            # Resolve tenant mapping
            mapping = db.query(TenantIdentityMapping).filter(
                TenantIdentityMapping.global_it_tenant_id == tenant_id
            ).first()
            
            if not mapping:
                raise HTTPException(status_code=403, detail="Tenant mapping not found")

            # Return authenticated context, overriding uid to be the iPhande profile ID
            return {
                "uid": mapping.iphande_profile_id,
                "sub": f"s2s:{tenant_id}",
                "email": None,
                "is_mock": False,
                "is_service": True,
                "tenant_id": tenant_id
            }

        # 2. Native iPhande Supabase Authentication
        alg = header.get("alg", "HS256")
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
            signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=None,
                options={"verify_aud": False},
            )

        uid = payload.get("sub")
        email = payload.get("email")

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


async def get_s2s_identity(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    """
    Validates only the S2S token without requiring an existing mapping.
    Used exclusively for the bootstrap endpoint.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        if not GLOBAL_IT_PUBLIC_KEYS:
            raise HTTPException(status_code=500, detail="GLOBAL_IT_PUBLIC_KEYS not configured on server")
            
        header = jwt.get_unverified_header(token)
        kid = header.get("kid", "v1")
        public_key = GLOBAL_IT_PUBLIC_KEYS.get(kid)
        if not public_key:
            raise HTTPException(status_code=401, detail=f"Unknown key ID: {kid}")
            
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer="global-it",
            audience="iphande"
        )
        
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing tenant_id")

        return {
            "is_service": True,
            "tenant_id": tenant_id
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

