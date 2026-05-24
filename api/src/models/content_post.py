from sqlalchemy import Column, String, DateTime
from src.database import Base
import uuid
from datetime import datetime

class ContentPost(Base):
    __tablename__ = "content_posts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_profile_id = Column(String, nullable=False)
    business_line = Column(String, nullable=False)
    channel = Column(String, nullable=False)
    post_type = Column(String, nullable=False)
    template_key = Column(String, nullable=True)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    call_to_action = Column(String, nullable=False)
    whatsapp_share_url = Column(String, nullable=True)
    facebook_share_url = Column(String, nullable=True)
    linked_media_id = Column(String, nullable=True)
    linked_campaign_id = Column(String, nullable=True)
    status = Column(String, default="draft", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
