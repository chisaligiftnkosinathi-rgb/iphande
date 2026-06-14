from typing import List, Dict, Any
from .document_schemas import (
    ValidatedDraft, CanonicalDraft, CanonicalSection,
    SectionOrigin, AppliedStandard
)
from .registry_loaders import RegistryLoader
from .template_section_registry import SectionMutability, SectionSemanticFamily

class DraftHydrationPipeline:
    """
    Transforms a ValidatedDraft into a CanonicalDraft.
    Injects standard disclosures, system-generated continuity blocks,
    and preserves mutability boundaries without reinterpreting steward meaning.
    """

    @staticmethod
    def hydrate(validated_draft: ValidatedDraft) -> CanonicalDraft:
        canonical_sections: List[CanonicalSection] = []

        # 1. Load the template to determine the strict constitutional order
        template = RegistryLoader.get_template(validated_draft.template_key)

        # Map of steward-provided sections from the validated draft
        steward_sections = {s.section_key: s for s in validated_draft.sections}

        # 2. Build the document sequentially based on the Template blueprint
        for section_key in template.sections:
            registry_section = RegistryLoader.get_section(section_key)

            # Case A: System Generated Continuity Block
            if registry_section.mutability == SectionMutability.SYSTEM_GENERATED:
                canonical_sections.append(CanonicalSection(
                    section_key=section_key,
                    section_label=registry_section.section_label,
                    semantic_family=registry_section.semantic_family,
                    mutability=registry_section.mutability,
                    origin=SectionOrigin.SYSTEM_GENERATED,
                    content={
                        "parent_event_id": validated_draft.parent_event_id,
                        "status": "pending_replay_bind"
                    }
                ))
                continue

            # Case B: Immutable Disclosure (Injected by Standard)
            if registry_section.semantic_family == SectionSemanticFamily.DISCLOSURE:
                combined_disclosures = [
                    std.disclosure_boundary for std in validated_draft.applied_standards
                ]
                canonical_sections.append(CanonicalSection(
                    section_key=section_key,
                    section_label=registry_section.section_label,
                    semantic_family=registry_section.semantic_family,
                    mutability=registry_section.mutability,
                    origin=SectionOrigin.STANDARD_INJECTED,
                    content={
                        "disclosures": combined_disclosures,
                        "notice": "This section is standard-mandated and structurally immutable."
                    }
                ))
                continue

            # Case C: Steward Declared Content
            if section_key in steward_sections:
                steward_sec = steward_sections[section_key]
                canonical_sections.append(CanonicalSection(
                    section_key=section_key,
                    section_label=registry_section.section_label,
                    semantic_family=registry_section.semantic_family,
                    mutability=registry_section.mutability,
                    origin=SectionOrigin.STEWARD_DECLARED,
                    content=steward_sec.content
                ))
                continue

            # Case D: Empty/Derived Context (Optional sections skipped by steward)
            canonical_sections.append(CanonicalSection(
                section_key=section_key,
                section_label=registry_section.section_label,
                semantic_family=registry_section.semantic_family,
                mutability=registry_section.mutability,
                origin=SectionOrigin.DERIVED_CONTEXT,
                content={}
            ))

        return CanonicalDraft(
            archetype_key=validated_draft.archetype_key,
            template_key=validated_draft.template_key,
            parent_event_id=validated_draft.parent_event_id,
            applied_standards=validated_draft.applied_standards,
            sections=canonical_sections,
            registry_versions=validated_draft.registry_versions
        )
