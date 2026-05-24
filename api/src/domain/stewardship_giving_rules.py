from enum import Enum

class GivingPurpose(str, Enum):
    infrastructure = "infrastructure"
    education = "education"
    community_support = "community_support"
    operational_sustainability = "operational_sustainability"
    emergency_support = "emergency_support"

ALLOWED_GIVING_TRANSITIONS = {
    "pledged": ["received_demo"],
    "received_demo": ["allocated"],
    "allocated": ["used", "reversed"],
    "used": ["reported"]
}

def validate_giving_transition(current_state: str, next_state: str) -> None:
    allowed = ALLOWED_GIVING_TRANSITIONS.get(current_state, [])
    if next_state not in allowed:
        raise ValueError(f"Invalid Giving transition: {current_state} -> {next_state}")

def validate_giving_payload(payload: dict) -> None:
    if "purpose" not in payload or not payload["purpose"]:
        raise ValueError("Giving must have a stated purpose.")

    if "governance_authority" in payload or "influence" in payload:
        raise ValueError("Giving must not create governance authority.")
    if "ranking" in payload or "top_donor" in payload:
        raise ValueError("Giving must not create public giver ranking.")
    if "urgency" in payload or "pressure" in payload:
        raise ValueError("No urgency manipulation or emotional pressure allowed.")
