from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth

if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        "projectId": "helios-prime-kdb3m"
    })

security = HTTPBearer()

def get_current_firebase_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    print("TOKEN RECEIVED")
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        print("UID:", decoded_token.get("uid"))
        return decoded_token
    except Exception as e:
        print("VERIFY ERROR:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
