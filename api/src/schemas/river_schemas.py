from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

class RiverEventPayload(BaseModel):
    event_id: str
    event_type: str
    source: str
    reference_id: str
    timestamp: int
    
    # Phase 4: Ledger Hash Chain
    prev_hash: Optional[str] = None
    event_hash: Optional[str] = None
    
    # Phase 8 & 9: Intelligence & Explanation Layer
    intelligence: List[Dict[str, Any]] = Field(default_factory=list)
    explanations: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Phase 10: Reasoning Layer
    caused_by: List[str] = Field(default_factory=list)
    causal: Dict[str, Any] = Field(default_factory=dict)
    
    verification_level: str = "verified"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RiverEventResponse(BaseModel):
    status: str
    message: str
    event_id: str
