from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .template_section_registry import SectionSemanticFamily, SectionMutability

class ValidationSeverity(str, Enum):
    BLOCKING = 'blocking'
    WARNING = 'warning'
    INFORMATIONAL = 'informational'

class SectionOrigin(str, Enum):
    STEWARD_DECLARED = 'steward_declared'
    STANDARD_INJECTED = 'standard_injected'
    SYSTEM_GENERATED = 'system_generated'
    REPLAY_BOUND = 'replay_bound'
    DERIVED_CONTEXT = 'derived_context'

class DraftSection(BaseModel):
    section_key: str
    content: Dict[str, Any]

class DocumentDraftPayload(BaseModel):
    archetype_key: str
    template_key: str
    parent_event_id: Optional[str] = None
    sections: List[DraftSection]

class AppliedStandard(BaseModel):
    standard_key: str
    disclosure_boundary: str
    required_sections: List[str] = []

class HydratedSection(DraftSection):
    section_label: str
    semantic_family: SectionSemanticFamily
    mutability: SectionMutability

class ValidatedDraft(BaseModel):
    archetype_key: str
    template_key: str
    parent_event_id: Optional[str] = None
    applied_standards: List[AppliedStandard]
    sections: List[HydratedSection]
    registry_versions: Dict[str, str] = Field(description="Captures the exact dictionary versions used during validation.")

class CanonicalSection(BaseModel):
    """A fully hydrated and provenance-aware section."""
    section_key: str
    section_label: str
    semantic_family: SectionSemanticFamily
    mutability: SectionMutability
    origin: SectionOrigin
    content: Dict[str, Any]

class CanonicalDraft(BaseModel):
    """The final enriched structure ready for rendering abstractions."""
    archetype_key: str
    template_key: str
    parent_event_id: Optional[str] = None
    applied_standards: List[AppliedStandard]
    sections: List[CanonicalSection]
    registry_versions: Dict[str, str]

class ValidationError(BaseModel):
    error_code: str
    message: str
    severity: ValidationSeverity
    offending_section_key: Optional[str] = None

class ValidationResult(BaseModel):
    is_valid: bool
    validated_draft: Optional[ValidatedDraft] = None
    errors: List[ValidationError] = []

    @property
    def has_blocking_errors(self) -> bool:
        return any(e.severity == ValidationSeverity.BLOCKING for e in self.errors)
