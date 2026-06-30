from sqlalchemy import Column, String, Float, Integer, JSON, DateTime
import datetime
import uuid
from src.database import Base

class TrustScore(Base):
    __tablename__ = "trust_scores"

    # We use profile_id as primary key to ensure 1:1 relationship
    profile_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Deterministic components
    proof_count = Column(Integer, default=0)
    work_proof_count = Column(Integer, default=0)
    opportunity_completion_rate = Column(Float, default=0.0)

    # Computed output
    visibility_score = Column(Integer, default=0)

    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

