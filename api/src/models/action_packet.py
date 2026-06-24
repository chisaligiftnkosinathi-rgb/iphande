from sqlalchemy import Column, String, Float, JSON, DateTime, Integer
import datetime
import uuid
from src.database import Base

class ActionPacket(Base):
    __tablename__ = "action_packets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, nullable=False)
    
    recipient_id = Column(String, nullable=False)
    channel = Column(String, nullable=False)  # "in_app" | "push" | "sms" | "whatsapp"
    
    title = Column(String, nullable=True)
    body = Column(String, nullable=True)
    
    action_type = Column(String, nullable=False)  # VIEW_MATCH, NAVIGATE_NOW, REQUEST_QUOTE
    
    priority = Column(Float, default=0.0)
    ttl_seconds = Column(Integer, default=3600)
    
    metadata_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="pending")  # pending | sent | delivered | failed
