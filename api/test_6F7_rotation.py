import os
import json
import jwt
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
from fastapi.testclient import TestClient

def generate_keypair():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
    
    return private_pem, public_pem

def generate_token(private_key, tenant_id, kid="v1"):
    payload = {
        "iss": "global-it",
        "aud": "iphande",
        "tenant_id": tenant_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5)
    }
    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": kid})

def test_rotation():
    print("--- 6F.7.1 Key Rotation Certification ---")
    
    priv_v1, pub_v1 = generate_keypair()
    priv_v2, pub_v2 = generate_keypair()
    
    db_path = "test_rotation.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
    os.environ["GLOBAL_IT_PUBLIC_KEYS"] = json.dumps({"v1": pub_v1})
    
    from src.database import create_tables, Base
    create_tables()
    print("Tables:", Base.metadata.tables.keys())
    
    from src.main import app
    client = TestClient(app)
    
    # Reload supabase_auth because it caches GLOBAL_IT_PUBLIC_KEYS at import
    from src.auth import supabase_auth
    supabase_auth.GLOBAL_IT_PUBLIC_KEYS = {"v1": pub_v1}
    
    tenant_id = "test-tenant-123"
    
    token_v1 = generate_token(priv_v1, tenant_id, kid="v1")
    token_v2 = generate_token(priv_v2, tenant_id, kid="v2")
    
    def check_token(token):
        r = client.get("/api/v1/bootstrap", headers={"Authorization": f"Bearer {token}"})
        # 401 means invalid signature. 403 means signature valid but no tenant mapping found.
        return r.status_code != 401

    print("Checking V1 token with V1 config...", end=" ")
    assert check_token(token_v1), "V1 token should work"
    print("OK")

    print("Checking V2 token with V1 config (should fail)...", end=" ")
    assert not check_token(token_v2), "V2 token should be rejected"
    print("OK")
    
    supabase_auth.GLOBAL_IT_PUBLIC_KEYS = {"v1": pub_v1, "v2": pub_v2}
    
    print("Checking V1 token during overlap...", end=" ")
    assert check_token(token_v1), "V1 token should still work"
    print("OK")
    
    print("Checking V2 token during overlap...", end=" ")
    assert check_token(token_v2), "V2 token should work now"
    print("OK")
    
    supabase_auth.GLOBAL_IT_PUBLIC_KEYS = {"v2": pub_v2}
    
    print("Checking V1 token after retirement (should fail)...", end=" ")
    assert not check_token(token_v1), "V1 token should be rejected"
    print("OK")
    
    print("Checking V2 token after retirement...", end=" ")
    assert check_token(token_v2), "V2 token should work"
    print("OK")
    
    print("ALL ROTATION TESTS PASSED!")

if __name__ == "__main__":
    test_rotation()
