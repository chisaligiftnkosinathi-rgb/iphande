from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from uuid import UUID
from datetime import datetime

class StewardTimelineEventOut(BaseModel):
    id: UUID
    event_type: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    parent_event_id: Optional[UUID] = None
    lineage_sequence: int
    created_at: datetime
    payload_summary: dict[str, Any]
    human_readable_label: str
    epistemic_boundary: str

    model_config = ConfigDict(from_attributes=True)
