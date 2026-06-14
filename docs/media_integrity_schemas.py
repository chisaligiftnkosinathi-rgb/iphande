from typing import List, Optional
from pydantic import BaseModel, Field

class MediaIntegrityLayer(BaseModel):
    """
    Cryptographic and transformation provenance of a media artifact.
    Tracks what happened to the file, entirely separate from its authenticity or temporal context.
    """
    file_hash: str = Field(..., description="Cryptographic proof of unaltered sensory continuity.")
    mime_type: str = Field(..., description="Exact media type for safe rendering and archive planning.")
    byte_size: int = Field(..., description="Size in bytes at the time of integrity hashing.")
    transformation_history: List[str] = Field(default_factory=list, description="E.g., ['cropped', 'rotated_90']")
    compression_history: List[str] = Field(default_factory=list, description="E.g., ['original', 'jpeg_85', 'av1_transcode']")
    derivative_chain: List[str] = Field(default_factory=list, description="Parent media_ids if this artifact was derived (e.g., thumbnail from raw video).")

class MediaPreservationStandard(BaseModel):
    """
    A standard governing the handling and preservation of the media.
    Governing Rule: Standards may shape preservation discipline. They may not manufacture authenticity.
    """
    standard_key: str = Field(..., description="E.g., 'PREMIS', 'ISO-15489', 'Dublin Core'")
    applied_discipline: str = Field(..., description="What this standard dictates for this artifact's preservation.")
    authenticity_disclaimer: str = Field(default="This standard ensures file integrity and preservation discipline. It does not certify the factual truthfulness of the media's contents.")
