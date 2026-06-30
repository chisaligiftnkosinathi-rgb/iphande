from pydantic import BaseModel
from datetime import datetime
from datetime import datetime

# Minimal upload output schema for continuity evidence
class MediaUploadOut(BaseModel):
    media_id: str
    file_url: str
    filename: str
    mime_type: str
    size: int
    created_at: datetime
    support_trace_id: str | None = None
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class EvidenceUploadIn(BaseModel):
    bucket_name: str
    public_url: str
    purpose: str
    profile_id: str
    opportunity_id: Optional[str] = None
    quote_id: Optional[str] = None

class MediaCreate(BaseModel):
    owner_profile_id: str
    title: str
    description: Optional[str] = None
    media_type: str
    file_url: str
    local_file_path: Optional[str] = None
    is_public: Optional[bool] = False

class MediaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    media_type: Optional[str] = None
    file_url: Optional[str] = None
    local_file_path: Optional[str] = None
    is_public: Optional[bool] = None

class MediaOut(BaseModel):
    id: str
    owner_profile_id: str
    title: str
    description: Optional[str]
    media_type: str
    file_url: str
    local_file_path: Optional[str]
    is_public: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MediaAnalysisOut(BaseModel):
    media_id: str
    analysis_mode: str = "deterministic_assist"
    intent_hypothesis: str
    business_context_used: bool
    confidence_boundary: str
    context_sources_used: list[str]
    context_gaps: list[str]
    evidence_boundary: str
    observations: list[str]
    suggested_caption: str
    suggested_cta: str
    human_approval_required: bool = True

class MediaDraftApprove(BaseModel):
    intent_hypothesis: str
    approved_caption: str
    approved_cta: str

class MediaDraftReject(BaseModel):
    intent_hypothesis: str

class MediaDraftCorrect(BaseModel):
    previous_interpretation_type: str
    corrected_interpretation_type: str
