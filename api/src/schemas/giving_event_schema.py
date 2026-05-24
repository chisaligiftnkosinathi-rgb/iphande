from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Optional

from src.domain.stewardship_giving_rules import GivingPurpose
from src.models.giving_event import GivingFlowState

class GivingEventPledge(BaseModel):
    business_owner_id: str
    amount: Decimal
    currency: str = "ZAR"
    purpose: GivingPurpose
    giver_reference: Optional[str] = None

    model_config = ConfigDict(extra="allow")

class GivingEventOut(BaseModel):
    id: UUID
    business_owner_id: str
    amount: Decimal
    currency: str
    purpose: GivingPurpose
    state: GivingFlowState
    giver_reference: Optional[str] = None
    created_at: datetime
    continuity_event_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)

class StewardshipReplayOut(BaseModel):
    business_owner_id: str
    currency: str
    total_pledged: Decimal
    total_received: Decimal
    total_allocated: Decimal
    total_used: Decimal
    events: list[GivingEventOut]
