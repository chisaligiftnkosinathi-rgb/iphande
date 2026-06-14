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
    TemplateSection(
        section_key='SEC-ID-001',
        section_label='Steward Context',
        semantic_family=SectionSemanticFamily.IDENTITY,
        mutability=SectionMutability.READONLY,
        description='Governed identity derived directly from the business profile.'
    ),
    TemplateSection(
        section_key='SEC-DISC-001',
        section_label='Standard Disclosure Notice',
        semantic_family=SectionSemanticFamily.DISCLOSURE,
        mutability=SectionMutability.IMMUTABLE,
        description='Mandatory footer injected by operational standards protecting against false authority.'
    ),
    TemplateSection(
        section_key='SEC-PRICE-001',
        section_label='Proposed Cost Breakdown',
        semantic_family=SectionSemanticFamily.PRICING,
        mutability=SectionMutability.MUTABLE,
        description='Detailed proposal of value exchange, editable by the steward.'
    ),
    TemplateSection(
        section_key='SEC-TRACE-001',
        section_label='Ingredient / Materials Sourcing',
        semantic_family=SectionSemanticFamily.TRACEABILITY,
        mutability=SectionMutability.STANDARD_MANDATED,
        description='Tracks origin of inputs. Required for food or industrial continuity templates.'
    ),
    TemplateSection(
        section_key='SEC-REFL-001',
        section_label='Steward Reflection',
        semantic_family=SectionSemanticFamily.REFLECTION,
        mutability=SectionMutability.MUTABLE,
        description='Captures teaching, pastoral notes, or operational wisdom.'
    ),
    TemplateSection(
        section_key='SEC-EVID-001',
        section_label='Visual Evidence Matrix',
        semantic_family=SectionSemanticFamily.EVIDENCE,
        mutability=SectionMutability.MUTABLE,
        description='Provides before/after or physical proof attached to the document.'
    ),
    TemplateSection(
        section_key='SEC-CONT-001',
        section_label='Replay Lineage Block',
        semantic_family=SectionSemanticFamily.CONTINUITY,
        mutability=SectionMutability.SYSTEM_GENERATED,
        description='Automatically renders the parent_event_id and timeline hashes anchoring the document to reality.'
    ),
]
