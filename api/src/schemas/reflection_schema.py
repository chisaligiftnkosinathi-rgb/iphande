from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ReflectionCreate(BaseModel):
    owner_profile_id: str
    reflection_date: datetime
    wins: str
    challenges: str
    lessons: str
    tomorrow_focus: str

class ReflectionUpdate(BaseModel):
    reflection_date: Optional[datetime]
    wins: Optional[str]
    challenges: Optional[str]
    lessons: Optional[str]
    tomorrow_focus: Optional[str]

class ReflectionOut(BaseModel):
    id: str
    owner_profile_id: str
    reflection_date: datetime
    wins: str
    challenges: str
    lessons: str
    tomorrow_focus: str
    created_at: datetime
    updated_at: datetime
    continuity_event_id: Optional[str] = None
    is_archived: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)
