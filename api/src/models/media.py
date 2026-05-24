from sqlalchemy import Column, String, DateTime, Boolean
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
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
