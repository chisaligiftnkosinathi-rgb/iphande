from pydantic import BaseModel
from datetime import datetime
from datetime import datetime

# Minimal upload output schema for continuity evidence
class MediaUploadOut(BaseModel):
    media_id: str
    media_url: str
    filename: str
    content_type: str
    created_at: datetime
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
    title: Optional[str]
    description: Optional[str]
    media_type: Optional[str]
    file_url: Optional[str]
    local_file_path: Optional[str]
    is_public: Optional[bool]

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
