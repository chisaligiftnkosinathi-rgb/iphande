from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ReplayBindingStrength(str, Enum):
    """
    Differentiates the structural weight of how an artifact binds to continuity.
    Prevents the system from treating all attachments as epistemologically equal.
    """
    DECLARATIVE = 'declarative'    # E.g., A promotional image, a self-authored reflection
    EVIDENTIARY = 'evidentiary'    # E.g., A signed job card, an uploaded payment receipt
    STRUCTURAL = 'structural'      # E.g., A formalized proposal or policy document
    DERIVED = 'derived'            # E.g., An AI summary, a system-generated thumbnail

class ArtifactType(str, Enum):
    DOCUMENT = 'document'
    MEDIA = 'media'

class ArtifactEventType(str, Enum):
    """
    Strictly descriptive events.
    These describe what happened to the artifact, not its truthfulness or authority.
    """
    # Document Events
    DOCUMENT_DRAFT_DECLARED = 'document_draft_declared'
    DOCUMENT_VALIDATED = 'document_validated'
    DOCUMENT_HYDRATED = 'document_hydrated'
    DOCUMENT_REPLAY_BOUND = 'document_replay_bound'

    # Media Events
    MEDIA_INGESTED = 'media_ingested'
    MEDIA_INTEGRITY_VERIFIED = 'media_integrity_verified'
    MEDIA_REPLAY_BOUND = 'media_replay_bound'
    MEDIA_DERIVATIVE_GENERATED = 'media_derivative_generated'

    # Shared Binding Events
    ARTIFACT_ATTACHED_TO_EVENT = 'artifact_attached_to_event'
    ARTIFACT_VISIBILITY_CHANGED = 'artifact_visibility_changed'

class ArtifactBindingContract(BaseModel):
    """
    The governing contract that anchors a document or media artifact to a specific continuity event.
    """
    artifact_id: str = Field(..., description="The unique ID of the Document or Media artifact.")
    artifact_type: ArtifactType = Field(..., description="Whether this is a Document or Media.")
    target_continuity_event_id: str = Field(..., description="The timeline event this artifact is anchoring to.")
    binding_strength: ReplayBindingStrength = Field(..., description="The structural weight of the attachment.")
    steward_id: str = Field(..., description="The human who authorized or initiated the binding.")

    governing_doctrine: str = Field(
        default="Binding preserves continuity linkage. Binding does not inflate certainty.",
        description="Immutable doctrine stamped onto every binding contract."
    )

class ArtifactEventPayload(BaseModel):
    """
    The base payload injected into the `continuity_events.payload_json` when an artifact event occurs.
    It preserves the artifact's metadata without duplicating the artifact's binary data into the event log.
    """
    artifact_id: str
    artifact_type: ArtifactType
    event_type: ArtifactEventType
    binding_strength: Optional[ReplayBindingStrength] = None

    # Descriptive metadata about the transition
    reason: Optional[str] = None
    context_snapshot: Dict[str, Any] = Field(
        default_factory=dict,
        description="A lightweight snapshot of context at the time of binding (e.g., draft version, hash)."
    )

class ArtifactVisibilityChangePayload(ArtifactEventPayload):
    """Payload for when an artifact's visibility is altered, tracking the exact transition."""
    previous_visibility: str
    new_visibility: str
    changed_by_steward_id: str
