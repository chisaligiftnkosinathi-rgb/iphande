import hashlib
import json

def canonical_json(payload: dict) -> str:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True)

def compute_event_hash(prev_hash: str, payload: dict, timestamp: int) -> str:
    body = canonical_json(payload)
    chain_string = f"{prev_hash}.{timestamp}.{body}"
    return hashlib.sha256(chain_string.encode("utf-8")).hexdigest()

def verify_ledger_event(event: dict, last_known_hash: str) -> bool:
    payload_for_hash = {k: v for k, v in event.items() if k not in ["event_hash"]}
    expected_hash = compute_event_hash(
        prev_hash=event.get("prev_hash"),
        payload=payload_for_hash,
        timestamp=event.get("timestamp")
    )

    if expected_hash != event.get("event_hash"):
        return False

    if event.get("prev_hash") != last_known_hash:
        return False

    return True
