from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class FollowUpCreate(BaseModel):
    opportunity_id: str
    due_date: datetime

class FollowUpOut(BaseModel):
    id: str
    opportunity_id: str
    due_date: datetime
    completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
