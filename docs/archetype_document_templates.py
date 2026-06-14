from enum import Enum
from pydantic import BaseModel
from typing import List

class DocumentVisibility(str, Enum):
    PUBLIC = 'public'
    STEWARD_ONLY = 'steward_only'
    LINEAGE_RESTRICTED = 'lineage_restricted'

class ReplayBindingMode(str, Enum):
    APPEND_ONLY = 'append_only'
    LINEAGE_LINKED = 'lineage_linked'

class RegistryVersion(BaseModel):
    registry_version: str
    last_updated: str
    governance_revision: str

ARCHETYPE_DOCUMENT_TEMPLATES_VERSION = RegistryVersion(
    registry_version="1.0.0",
    last_updated="2026-05-27",
    governance_revision="REV-001"
)

class ArchetypeDocumentTemplate(BaseModel):
    template_key: str
    archetype_key: str
    document_type: str
    title_pattern: str
    sections: List[str]
    visibility_default: DocumentVisibility
    replay_binding_mode: ReplayBindingMode
    governance_boundary: str

ARCHETYPE_DOCUMENT_TEMPLATES = [
    ArchetypeDocumentTemplate(
        template_key='TPL-MIN-001',
        archetype_key='community_ministry_steward',
        document_type='ministry_teaching',
        title_pattern='Teaching Scroll - {Title}',
        sections=[
            'SEC-ID-001',
            'SEC-REFL-001',
            'SEC-CONT-001'
        ],
        visibility_default=DocumentVisibility.PUBLIC,
        replay_binding_mode=ReplayBindingMode.APPEND_ONLY,
        governance_boundary='Teaching preserves declared interpretation. It does not manufacture spiritual authority.'
    ),
    ArchetypeDocumentTemplate(
        template_key='TPL-FIN-001',
        archetype_key='financial_insurance_steward',
        document_type='business_proposal',
        title_pattern='Family Cover Proposal - {ClientName}',
        sections=[
            'SEC-ID-001',
            'SEC-PRICE-001',
            'SEC-SIG-001'
        ],
        visibility_default=DocumentVisibility.LINEAGE_RESTRICTED,
        replay_binding_mode=ReplayBindingMode.LINEAGE_LINKED,
        governance_boundary='Proposal reflects declared offering. It does not guarantee outcome or final underwriter approval.'
    ),
    ArchetypeDocumentTemplate(
        template_key='TPL-RET-001',
        archetype_key='local_retail_steward',
        document_type='catalogue',
        title_pattern='Specials Catalogue - {Month}',
        sections=[
            'SEC-ID-001',
            'SEC-PRICE-001'
        ],
        visibility_default=DocumentVisibility.PUBLIC,
        replay_binding_mode=ReplayBindingMode.APPEND_ONLY,
        governance_boundary='Catalogue declares current availability. It does not guarantee future stock or indefinite pricing.'
    )
]
