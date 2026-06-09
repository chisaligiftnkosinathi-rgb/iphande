# migrated from docs/weaving_service.py
from typing import List, Dict
from ..domain.registry.document_schemas import (
    DocumentDraftPayload, ValidationResult, ValidationError,
    ValidationSeverity, ValidatedDraft, HydratedSection, AppliedStandard
)
from ..domain.registry.registry_loaders import RegistryLoader
from ..domain.templates.template_section_registry import SectionMutability, TEMPLATE_SECTION_REGISTRY_VERSION
from ..domain.templates.archetype_standard_registry import ARCHETYPE_STANDARD_REGISTRY_VERSION
from ..domain.templates.archetype_document_templates import ARCHETYPE_DOCUMENT_TEMPLATES_VERSION

class WeavingService:
    """
    Orchestrates the constitutional validation of a continuity document draft.
    It merges steward intent (payload) with systemic truth (registries).
    """

    @staticmethod
    def validate_and_weave(payload: DocumentDraftPayload) -> ValidationResult:
        errors: List[ValidationError] = []
        # ...existing code...
