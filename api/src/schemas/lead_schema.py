from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class LeadCreate(BaseModel):
    profile_slug: str
    name: str
    phone: str
    service_needed: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = "public_profile"

class LeadUpdate(BaseModel):
    status: str

class LeadOut(BaseModel):
    id: str
    profile_slug: str
    name: str
    phone: str
    service_needed: Optional[str] = None
    message: Optional[str] = None
    status: str
    source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
