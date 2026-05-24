from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CampaignCreate(BaseModel):
    owner_profile_id: str
    name: str
    channel: str
    goal: str
    message: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = "draft"

class CampaignUpdate(BaseModel):
    name: Optional[str]
    channel: Optional[str]
    goal: Optional[str]
    message: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: Optional[str]

class CampaignOut(BaseModel):
    id: str
    owner_profile_id: str
    name: str
    channel: str
    goal: str
    message: str
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
