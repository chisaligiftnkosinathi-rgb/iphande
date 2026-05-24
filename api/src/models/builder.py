from datetime import datetime, timezone
from typing import Any
from src.replay.constants import ContinuityEventType

def build_in_memory_event(
    *,
    event_type: ContinuityEventType,
    platform: str | None = None,
    goal_key: str | None = None,
    business_category_key: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "event_type": event_type,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "platform": platform,
        "goal_key": goal_key,
        "business_category_key": business_category_key,
        "payload": payload or {},
    }
