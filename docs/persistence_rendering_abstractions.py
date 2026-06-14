from enum import Enum
from typing import Protocol, Union, Any, Dict
from pydantic import BaseModel, Field
from .document_schemas import CanonicalDraft
from .media_schemas import CanonicalMediaArtifact, MediaRetentionPolicy

class RenderIntent(str, Enum):
    """
    Defines the semantic purpose of the rendering request.
    Prevents treating a timeline preview the same as a print-ready legal PDF.
    """
    TIMELINE_PREVIEW = 'timeline_preview'
    MOBILE_SUMMARY = 'mobile_summary'
    PRINT_QUALITY_PDF = 'print_quality_pdf'
    ACCESSIBILITY_EXPORT = 'accessibility_export'
    THUMBNAIL = 'thumbnail'
    PUBLIC_WEB = 'public_web'

class CanonicalArtifactSnapshot(BaseModel):
    """
    An immutable, mathematically frozen representation of an artifact at a specific point in time.
    Rendering engines must never operate on live mutable objects.
    """
    snapshot_id: str = Field(..., description="Unique ID for this exact frozen state.")
    snapshot_timestamp: str = Field(..., description="When this state was frozen.")
    artifact_id: str = Field(..., description="The ID of the underlying artifact.")
    artifact_payload: Union[CanonicalDraft, CanonicalMediaArtifact] = Field(
        ..., description="The fully hydrated, provenance-aware artifact data."
    )
    snapshot_hash: str = Field(..., description="Cryptographic hash of the artifact_payload to guarantee rendering fidelity.")

class ArtifactPersistenceContract(BaseModel):
    """
    The receipt provided by the Storage Boundary once an artifact is successfully preserved.
    """
    artifact_id: str
    storage_uri: str = Field(..., description="The immutable locator where the physical bytes are preserved.")
    mime_type: str
    byte_size: int
    storage_hash: str = Field(..., description="Hash of the preserved bytes, must match the snapshot_hash.")
    retention_applied: MediaRetentionPolicy

    governing_doctrine: str = Field(
        default="Storage preserves artifacts. Storage does not reinterpret artifacts.",
        description="Immutable doctrine stamped onto every persistence receipt."
    )

class RenderedOutput(BaseModel):
    """
    The result of a rendering operation.
    """
    snapshot_id: str
    intent: RenderIntent
    mime_type: str
    binary_data: bytes  # In a real implementation, this might be a stream or a temporary URI

    governing_doctrine: str = Field(
        default="Rendering transforms representation. Rendering may not mutate canonical continuity.",
        description="Immutable doctrine stamped onto every rendered output."
    )

class StorageBoundary(Protocol):
    """
    The strict interface for any future storage implementation (e.g., S3, local disk).
    """
    def preserve_artifact(self, snapshot: CanonicalArtifactSnapshot) -> ArtifactPersistenceContract:
        ...

    def retrieve_artifact(self, storage_uri: str) -> bytes:
        ...

class RenderingBoundary(Protocol):
    """
    The strict interface for any future rendering engine (e.g., PDF generator, image resizer).
    """
    def render_snapshot(self, snapshot: CanonicalArtifactSnapshot, intent: RenderIntent) -> RenderedOutput:
        ...
