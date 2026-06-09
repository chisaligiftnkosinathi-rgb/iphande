# migrated from docs/persistence_rendering_abstractions.py
from enum import Enum
from typing import Protocol, Union, Any, Dict
from pydantic import BaseModel, Field
from ..registry.document_schemas import CanonicalDraft
from ..media.media_schemas import CanonicalMediaArtifact, MediaRetentionPolicy

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
    # ...existing code...

class ArtifactPersistenceContract(BaseModel):
    # ...existing code...
