from sqlalchemy import Column, String, Float, JSON, DateTime
import datetime
import uuid
from src.database import Base

class TrustScore(Base):
    __tablename__ = "trust_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(String, nullable=False, unique=True)

    # Core dimensions
    reliability_score = Column(Float, default=0.5)      # does user complete actions?
    response_speed_score = Column(Float, default=0.5)   # how fast they react
    completion_score = Column(Float, default=0.5)       # do they finish jobs?
    consistency_score = Column(Float, default=0.5)      # behavior stability over time

    # Derived
    overall_trust = Column(Float, default=0.5)

    # Contextual trust
    archetype_trust = Column(JSON, default=dict)        # {"electrician": 0.82}
    geo_trust = Column(JSON, default=dict)              # {"pretoria_north": 0.77}

    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
