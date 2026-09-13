from datetime import datetime, timedelta
from jose import JWTError, jwt, ExpiredSignatureError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.database import get_db
from src.models.user import User
from sqlalchemy.orm import Session


from src.config import settings

SECRET_KEY = settings.JWT_SECRET

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

security = HTTPBearer()

import os
import hashlib
import hmac

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    pwd_context = None

def hash_password_pbkdf2(password: str) -> str:
    salt = os.urandom(16).hex()
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2:sha256:{iterations}${salt}${derived.hex()}"

def verify_password_pbkdf2(plain_password: str, hashed_password: str) -> bool:
    try:
        method, salt, hash_val = hashed_password.split("$")
        parts = method.split(":")
        iterations = int(parts[2])
        derived = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(derived.hex(), hash_val)
    except Exception:
        return False

def verify_password(plain_password: str, hashed_password: str):
    if not hashed_password:
        return False
    if hashed_password.startswith("pbkdf2:"):
        return verify_password_pbkdf2(plain_password, hashed_password)
    # Legacy / bcrypt fallback
    if pwd_context is not None:
        try:
            safe_password = plain_password[:72]
            return pwd_context.verify(safe_password, hashed_password)
        except Exception:
            pass
    return False

def get_password_hash(password: str):
    return hash_password_pbkdf2(password)

# ---------------------------------------------------
# TOKEN CREATION
# ---------------------------------------------------

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------
# TOKEN VALIDATION
# ---------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token verification failed")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from src.core.logging import user_id_context
    user_id_context.set(str(user.id))

    return {
        "uid": str(user.id),
        "sub": str(user.id),
        "email": user.email,
        "is_mock": False
    }
