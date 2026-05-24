from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class OpportunityCreate(BaseModel):
    profile_id: str
    title: str
    description: Optional[str] = None

class OpportunityUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[str]

class OpportunityOut(BaseModel):
    id: str
    profile_id: str
    title: str
    description: Optional[str]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
