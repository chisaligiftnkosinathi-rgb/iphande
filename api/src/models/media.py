from sqlalchemy import Column, String, DateTime, Boolean, Integer
from src.database import Base
import uuid
from datetime import datetime

class Media(Base):
    __tablename__ = "media"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_profile_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    media_type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    local_file_path = Column(String, nullable=True)
    size = Column(Integer, nullable=True)
    
    proof_type = Column(String, default="context")  # identity | work | context
    linked_entity_type = Column(String, nullable=True)
    linked_entity_id = Column(String, nullable=True)
    
    storage_origin = Column(String, nullable=False, default="human_device")
    storage_provider = Column(String, nullable=False, default="local")
    allow_exif_processing = Column(Boolean, nullable=False, default=False)
    allow_location_extraction = Column(Boolean, nullable=False, default=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    continuity_event_id = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=True)
