import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from src.database import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Hierarchy codes
    place_code = Column(String, unique=True, nullable=False, index=True)
    parent_place_code = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False, index=True)

    # province, district, municipality, main_place, sub_place
    level = Column(String, nullable=False, index=True)

    # Denormalized context for fast searching & filtering without JOINs
    province_code = Column(String, nullable=True)
    province_name = Column(String, nullable=True)
    district_code = Column(String, nullable=True)
    district_name = Column(String, nullable=True)
    municipality_code = Column(String, nullable=True)
    municipality_name = Column(String, nullable=True)

    source = Column(String, default="stats_sa", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
