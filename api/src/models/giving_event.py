import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum as SAEnum, Numeric
from sqlalchemy.types import Uuid

from src.database import Base
from src.domain.stewardship_giving_rules import GivingPurpose

class GivingFlowState(str, enum.Enum):
    pledged = "pledged"
    received_demo = "received_demo"
    allocated = "allocated"
    used = "used"
    reported = "reported"
    reversed = "reversed"

class GivingEvent(Base):
    __tablename__ = "giving_events"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    business_owner_id = Column(String, index=True, nullable=False)
    giver_reference = Column(String, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="ZAR")
    purpose = Column(SAEnum(GivingPurpose), nullable=False)
    state = Column(SAEnum(GivingFlowState), default=GivingFlowState.pledged)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    continuity_event_id = Column(Uuid, nullable=True)
