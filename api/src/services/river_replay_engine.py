import json
from typing import List, Dict

from .river_hash_chain import compute_event_hash

def canonical_payload(event: Dict) -> Dict:
    """Remove computed fields so we only hash original intent"""
    return {
        k: v for k, v in event.items()
        if k not in ["event_hash", "prev_hash"]
    }

def replay_chain(events: List[Dict], genesis_hash: str):
    """
    Rebuilds the entire River chain from genesis.
    Returns full validation report.
    """
    results = {
        "valid": True,
        "break_index": None,
        "errors": [],
        "final_hash": genesis_hash
    }

    prev_hash = genesis_hash

    for index, event in enumerate(events):
        expected_hash = compute_event_hash(
            prev_hash=prev_hash,
            payload=canonical_payload(event),
            timestamp=event.get("timestamp")
        )

        # 1. Validate event hash
        if expected_hash != event.get("event_hash"):
            results["valid"] = False
            results["break_index"] = index
            results["errors"].append({
                "type": "HASH_MISMATCH",
                "event_id": event.get("event_id"),
                "index": index
            })
            break

        # 2. Validate chain continuity
        if event.get("prev_hash") != prev_hash:
            results["valid"] = False
            results["break_index"] = index
            results["errors"].append({
                "type": "CHAIN_BREAK",
                "event_id": event.get("event_id"),
                "index": index
            })
            break

        prev_hash = event.get("event_hash")

    results["final_hash"] = prev_hash
    return results
