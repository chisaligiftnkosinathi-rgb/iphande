from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class ScriptureReflectionCreate(BaseModel):
    owner_profile_id: str
    reflection_date: date
    situation_key: str
    linked_reflection_id: Optional[str] = None
    linked_opportunity_id: Optional[str] = None

class ScriptureReflectionUpdate(BaseModel):
    reflection_date: Optional[date]
    situation_key: Optional[str]
    scripture_reference: Optional[str]
    scripture_text: Optional[str]
    encouragement_note: Optional[str]
    linked_reflection_id: Optional[str]
    linked_opportunity_id: Optional[str]

class ScriptureReflectionRead(BaseModel):
    id: str
    owner_profile_id: str
    reflection_date: date
    situation_key: str
    scripture_reference: str
    scripture_text: str
    encouragement_note: str
    linked_reflection_id: Optional[str]
    linked_opportunity_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
