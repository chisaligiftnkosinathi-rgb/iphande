from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from src.database import Base
import uuid
from datetime import datetime


class ContinuityCaptureStatusEnum(str, Enum):
    captured = "captured"
    reviewed = "reviewed"
    linked = "linked"
    archived = "archived"

class ContinuityCaptureSourceTypeEnum(str, Enum):
    quick_text = "quick_text"
    voice_note = "voice_note"
    screenshot = "screenshot"
    photo = "photo"
    whatsapp_context = "whatsapp_context"
    payment_signal = "payment_signal"
    promise_fragment = "promise_fragment"
    other = "other"

class ContinuityCapture(Base):
    __tablename__ = "continuity_captures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    steward_id = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    raw_text = Column(String, nullable=True)
    raw_media_id = Column(String, nullable=True)
    context_hint = Column(String, nullable=True)
    status = Column(String, nullable=False, default="captured")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
