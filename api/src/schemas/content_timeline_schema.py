from pydantic import BaseModel, Field
from typing import Any, List
from datetime import datetime

class ContentTimelineEvent(BaseModel):
    event_type: str
    occurred_at: datetime
    platform: str
    goal_key: str | None = None
    business_category_key: str | None = None
    payload: dict[str, Any] = {}

class ContentTimelineOut(BaseModel):
    content_post_id: str
    event_count: int
    events: List[ContentTimelineEvent]
