import os
import json
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, credentials

if not firebase_admin._apps:
    firebase_sa = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if firebase_sa:
        cred = credentials.Certificate(json.loads(firebase_sa))
        firebase_admin.initialize_app(cred)
    else:
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
