import hmac
import hashlib
import json
import time
from typing import Dict, Any

ALLOWED_SKEW_SECONDS = 300  # 5 min

def verify_signature(secret: str, payload: Dict[str, Any], signature: str, timestamp: str) -> bool:
    if not signature or not timestamp:
        return False
        
    try:
        ts = int(timestamp)
    except Exception:
        return False

    # Reject old/replay requests
    if abs(int(time.time()) - ts) > ALLOWED_SKEW_SECONDS:
        return False

    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signing_string = f"{ts}.{body}"

    expected = hmac.new(
        secret.encode(),
        signing_string.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature)
