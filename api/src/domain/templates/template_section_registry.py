# migrated from docs/template_section_registry.py
from enum import Enum
from pydantic import BaseModel

class SectionSemanticFamily(str, Enum):
    IDENTITY = 'identity_section'
    DISCLOSURE = 'disclosure_section'
    PRICING = 'pricing_section'
    TRACEABILITY = 'traceability_section'
    REFLECTION = 'reflection_section'
    EVIDENCE = 'evidence_section'
    CONTINUITY = 'continuity_section'
    INTERPRETATION = 'interpretation_section'
    SIGNATURE = 'signature_section'

class SectionMutability(str, Enum):
    MUTABLE = 'mutable'
    READONLY = 'readonly'
    IMMUTABLE = 'immutable'
    SYSTEM_GENERATED = 'system_generated'
    STANDARD_MANDATED = 'standard_mandated'

class RegistryVersion(BaseModel):
    registry_version: str
    last_updated: str
    governance_revision: str

TEMPLATE_SECTION_REGISTRY_VERSION = RegistryVersion(
    registry_version="1.0.0",
    last_updated="2026-05-27",
    governance_revision="REV-001"
)

class TemplateSection(BaseModel):
    section_key: str
    section_label: str
    semantic_family: SectionSemanticFamily
    mutability: SectionMutability
    description: str

TEMPLATE_SECTION_REGISTRY = [
    # ...existing code...
]
