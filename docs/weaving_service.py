from typing import List, Dict
from .document_schemas import (
    DocumentDraftPayload, ValidationResult, ValidationError,
    ValidationSeverity, ValidatedDraft, HydratedSection, AppliedStandard
)
from .registry_loaders import RegistryLoader
from .template_section_registry import SectionMutability, TEMPLATE_SECTION_REGISTRY_VERSION
from .archetype_standard_registry import ARCHETYPE_STANDARD_REGISTRY_VERSION
from .archetype_document_templates import ARCHETYPE_DOCUMENT_TEMPLATES_VERSION

class WeavingService:
    """
    Orchestrates the constitutional validation of a continuity document draft.
    It merges steward intent (payload) with systemic truth (registries).
    """

    @staticmethod
    def validate_and_weave(payload: DocumentDraftPayload) -> ValidationResult:
        errors: List[ValidationError] = []

        # 1. Validate Template Authority
        template = RegistryLoader.get_template(payload.template_key)
        if not template:
            errors.append(ValidationError(
                error_code="UNKNOWN_TEMPLATE",
                message=f"Template {payload.template_key} is not registered.",
                severity=ValidationSeverity.BLOCKING
            ))
            return ValidationResult(is_valid=False, errors=errors)

        if template.archetype_key != payload.archetype_key:
            errors.append(ValidationError(
                error_code="ARCHETYPE_MISMATCH",
                message=f"Archetype {payload.archetype_key} is not authorized to use template {payload.template_key}.",
                severity=ValidationSeverity.BLOCKING
            ))

        # 2. Activate Standards
        standards = RegistryLoader.get_standards_for_archetype(payload.archetype_key)
        applied_standards: List[AppliedStandard] = []
        mandated_section_keys = set()

        for standard in standards:
            applied_standards.append(AppliedStandard(
                standard_key=standard.standard_key,
                disclosure_boundary=standard.disclosure_boundary,
                required_sections=[] # Could be populated dynamically based on parsing standard logic
            ))
            # Simulating mandated section lookup based on standard operational rules
            if standard.standard_key == 'STD-FOOD-001':
                mandated_section_keys.add('SEC-TRACE-001')

        # 3. Hydrate & Validate Sections
        hydrated_sections: List[HydratedSection] = []
        provided_keys = set()

        for draft_section in payload.sections:
            registry_section = RegistryLoader.get_section(draft_section.section_key)
            if not registry_section:
                errors.append(ValidationError(
                    error_code="UNKNOWN_SECTION",
                    message=f"Section {draft_section.section_key} is not a valid semantic block.",
                    severity=ValidationSeverity.BLOCKING,
                    offending_section_key=draft_section.section_key
                ))
                continue

            provided_keys.add(draft_section.section_key)

            # Rule: System generated sections cannot be authored by the steward
            if registry_section.mutability == SectionMutability.SYSTEM_GENERATED:
                errors.append(ValidationError(
                    error_code="ILLEGAL_SYSTEM_SECTION",
                    message=f"Steward payload attempted to supply system_generated section {draft_section.section_key}.",
                    severity=ValidationSeverity.BLOCKING,
                    offending_section_key=draft_section.section_key
                ))
                continue

            hydrated_sections.append(HydratedSection(
                section_key=draft_section.section_key,
                content=draft_section.content,
                section_label=registry_section.section_label,
                semantic_family=registry_section.semantic_family,
                mutability=registry_section.mutability
            ))

        # 4. Enforce Mandated Sections
        missing_mandated = mandated_section_keys - provided_keys
        for missing_key in missing_mandated:
            errors.append(ValidationError(
                error_code="MISSING_MANDATED_SECTION",
                message=f"Standard mandated section {missing_key} is missing from the draft.",
                severity=ValidationSeverity.BLOCKING,
                offending_section_key=missing_key
            ))

        # 5. Compile Result
        has_blocking = any(e.severity == ValidationSeverity.BLOCKING for e in errors)

        if has_blocking:
            return ValidationResult(is_valid=False, errors=errors)

        validated_draft = ValidatedDraft(
            archetype_key=payload.archetype_key,
            template_key=payload.template_key,
            parent_event_id=payload.parent_event_id,
            applied_standards=applied_standards,
            sections=hydrated_sections,
            registry_versions={
                "templates": ARCHETYPE_DOCUMENT_TEMPLATES_VERSION.registry_version,
                "standards": ARCHETYPE_STANDARD_REGISTRY_VERSION.registry_version,
                "sections": TEMPLATE_SECTION_REGISTRY_VERSION.registry_version
            }
        )

        return ValidationResult(is_valid=True, validated_draft=validated_draft, errors=errors)
