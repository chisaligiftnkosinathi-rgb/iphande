from typing import Optional, List
from .archetype_document_templates import ARCHETYPE_DOCUMENT_TEMPLATES, ArchetypeDocumentTemplate
from .archetype_standard_registry import ARCHETYPE_STANDARD_REGISTRY, ArchetypeStandard
from .template_section_registry import TEMPLATE_SECTION_REGISTRY, TemplateSection

class RegistryLoader:
    """Safe, deterministic read-only access to constitutional dictionaries."""

    @staticmethod
    def get_template(template_key: str) -> Optional[ArchetypeDocumentTemplate]:
        for t in ARCHETYPE_DOCUMENT_TEMPLATES:
            if t.template_key == template_key:
                return t
        return None

    @staticmethod
    def get_standards_for_archetype(archetype_key: str) -> List[ArchetypeStandard]:
        return [s for s in ARCHETYPE_STANDARD_REGISTRY if archetype_key in s.applicable_archetypes]

    @staticmethod
    def get_section(section_key: str) -> Optional[TemplateSection]:
        for s in TEMPLATE_SECTION_REGISTRY:
            if s.section_key == section_key:
                return s
        return None
