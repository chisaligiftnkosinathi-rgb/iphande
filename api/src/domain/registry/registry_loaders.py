# migrated from docs/registry_loaders.py
from typing import Optional, List
from ..templates.archetype_document_templates import ARCHETYPE_DOCUMENT_TEMPLATES, ArchetypeDocumentTemplate
from ..templates.archetype_standard_registry import ARCHETYPE_STANDARD_REGISTRY, ArchetypeStandard
from ..templates.template_section_registry import TEMPLATE_SECTION_REGISTRY, TemplateSection

class RegistryLoader:
    """Safe, deterministic read-only access to constitutional dictionaries."""
    # ...existing code...
