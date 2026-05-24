from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MessageTemplateCreate(BaseModel):
    owner_profile_id: str
    title: str
    category: str
    body: str
    is_active: Optional[bool] = True

class MessageTemplateUpdate(BaseModel):
    title: Optional[str]
    category: Optional[str]
    body: Optional[str]
    is_active: Optional[bool]

class MessageTemplateOut(BaseModel):
    id: str
    owner_profile_id: str
    title: str
    category: str
    body: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
