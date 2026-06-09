from pydantic import BaseModel, Field, root_validator
from typing import Optional, Literal
from datetime import datetime
import uuid

class ContinuityCaptureBase(BaseModel):
    steward_id: str
    source_type: Literal[
        "quick_text", "voice_note", "screenshot", "photo", "whatsapp_context", "payment_signal", "promise_fragment", "other"
    ]
    raw_text: Optional[str] = None
    raw_media_id: Optional[str] = None
    context_hint: Optional[str] = None
    status: Optional[Literal["captured", "reviewed", "linked", "archived"]] = "captured"

    @root_validator(skip_on_failure=True)
    def at_least_one_field(cls, values):
        if not (values.get("raw_text") or values.get("raw_media_id") or values.get("context_hint")):
            raise ValueError("At least one of raw_text, raw_media_id, or context_hint must be present.")
        return values

class ContinuityCaptureCreate(ContinuityCaptureBase):
    pass

class ContinuityCaptureRead(ContinuityCaptureBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
