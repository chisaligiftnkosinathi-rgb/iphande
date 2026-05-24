from pydantic import BaseModel, Field
from typing import Optional, Any, Literal
from uuid import UUID
from datetime import datetime
from src.replay.constants import ContinuityEventType, ActorType

class ContinuityEventCreate(BaseModel):
    business_owner_id: str
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    event_type: ContinuityEventType
    actor_type: ActorType
    actor_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    parent_event_id: Optional[UUID] = None
    payload_json: Optional[Any] = None

class ContinuityEventResponse(BaseModel):
    id: UUID
    business_owner_id: str
    lineage_sequence: int
    business_category_key: Optional[str] = None
    business_line: Optional[str] = None
    event_type: str
    actor_type: str
    actor_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    parent_event_id: Optional[UUID] = None
    payload_json: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ContinuityEventGraphEdge(BaseModel):
    source_event_id: UUID
    target_event_id: UUID


class ContinuityEventGraphResponse(BaseModel):
    root_event: ContinuityEventResponse
    nodes: list[ContinuityEventResponse]
    edges: list[ContinuityEventGraphEdge]
    truncated: bool
    max_depth: int
    cycle_detected: bool
    direction: Literal["upstream", "downstream", "both"]
