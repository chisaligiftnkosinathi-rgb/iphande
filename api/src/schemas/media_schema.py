from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MediaCreate(BaseModel):
    owner_profile_id: str
    title: str
    description: Optional[str] = None
    media_type: str
    file_url: str
    local_file_path: Optional[str] = None
    is_public: Optional[bool] = False

class MediaUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    media_type: Optional[str]
    file_url: Optional[str]
    local_file_path: Optional[str]
    is_public: Optional[bool]

class MediaOut(BaseModel):
    id: str
    owner_profile_id: str
    title: str
    description: Optional[str]
    media_type: str
    file_url: str
    local_file_path: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
