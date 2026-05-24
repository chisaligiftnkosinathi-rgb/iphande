from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TimelineEventCreate(BaseModel):
    event_type: str
    description: Optional[str] = None

class TimelineEventOut(BaseModel):
    id: str
    opportunity_id: str
    event_type: str
    description: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
