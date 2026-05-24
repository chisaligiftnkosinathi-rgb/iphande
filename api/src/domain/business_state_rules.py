"""
Defines business state rules and lifecycle governance for business objects.
"""

from enum import Enum, auto

class StateTransitionError(Exception):
    pass

class BusinessObjectState(Enum):
    # Generic states for extension
    DRAFT = auto()
    ISSUED = auto()
    ACCEPTED = auto()
    EXPIRED = auto()
    CANCELLED = auto()
    PARTIALLY_PAID = auto()
    PAID = auto()
    OVERDUE = auto()
    PENDING = auto()
    CONFIRMED = auto()
    FAILED = auto()
    REVERSED = auto()

ALLOWED_QUOTE_TRANSITIONS = {
    "draft": ["issued"],
    "issued": ["accepted", "expired", "cancelled"],
    "accepted": ["cancelled"]
}

ALLOWED_INVOICE_TRANSITIONS = {
    "draft": ["issued"],
    "issued": ["partially_paid", "paid", "overdue"],
    "partially_paid": ["paid", "overdue"],
    "overdue": ["paid"]
}

ALLOWED_PAYMENT_TRANSITIONS = {
    "created": ["pending"],
    "pending": ["confirmed", "failed"],
    "confirmed": ["reversed"]
}

def validate_transition(entity_type: str, current_state: str, next_state: str) -> None:
    transitions_map = {
        "Quote": ALLOWED_QUOTE_TRANSITIONS,
        "Invoice": ALLOWED_INVOICE_TRANSITIONS,
        "PaymentIntent": ALLOWED_PAYMENT_TRANSITIONS,
    }

    if entity_type not in transitions_map:
        raise ValueError(f"Unknown entity type: {entity_type}")

    allowed = transitions_map[entity_type].get(current_state, [])
    if next_state not in allowed:
        raise ValueError(f"Invalid {entity_type} transition: {current_state} -> {next_state}")

# Utility for logging and enforcing transitions
def log_state_transition(obj_type, obj_id, from_state, to_state, allowed, reason=None):
    # Placeholder for logging
    print(f"{obj_type} {obj_id}: {from_state.name} → {to_state.name} | allowed={allowed} | reason={reason}")
