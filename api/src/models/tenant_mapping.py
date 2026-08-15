from sqlalchemy import Column, String, DateTime, ForeignKey
import uuid
from datetime import datetime
from src.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class TenantIdentityMapping(Base):
    __tablename__ = "tenant_identity_mapping"

    id = Column(String, primary_key=True, default=generate_uuid)
    global_it_tenant_id = Column(String, unique=True, nullable=False, index=True)
    iphande_profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
