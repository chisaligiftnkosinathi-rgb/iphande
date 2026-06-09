from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class StewardAnnotationCreate(BaseModel):
    target_event_id: str
    steward_id: str
    annotation_type: str = Field(default="context")
    body: str
    visibility: str = Field(default="bounded")


class StewardAnnotationOut(StewardAnnotationCreate):
    id: str
    continuity_event_id: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
