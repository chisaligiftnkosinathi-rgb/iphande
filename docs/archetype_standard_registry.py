from pydantic import BaseModel
from typing import List

class RegistryVersion(BaseModel):
    registry_version: str
    last_updated: str
    governance_revision: str

ARCHETYPE_STANDARD_REGISTRY_VERSION = RegistryVersion(
    registry_version="1.0.0",
    last_updated="2026-05-27",
    governance_revision="REV-001"
)

class ArchetypeStandard(BaseModel):
    standard_key: str
    standard_name: str
    applicable_archetypes: List[str]
    operational_purpose: str
    template_influence: str
    disclosure_boundary: str
    verification_required: bool

ARCHETYPE_STANDARD_REGISTRY = [
    ArchetypeStandard(
        standard_key='STD-FOOD-001',
        standard_name='HACCP / ISO 22000 Operational Principles',
        applicable_archetypes=['food_catering_steward', 'agriculture_farming_steward'],
        operational_purpose='Food safety management, ingredient traceability, and safe handling structure.',
        template_influence='Mandates Preparation Context, Ingredient Traceability, and Storage Conditions sections.',
        disclosure_boundary='Structured with food continuity practices. This document does not constitute independent food safety certification.',
        verification_required=False,
    ),
    ArchetypeStandard(
        standard_key='STD-FIN-001',
        standard_name='FAIS-Aligned Disclosure & POPIA Privacy Awareness',
        applicable_archetypes=['financial_insurance_steward', 'property_housing_steward'],
        operational_purpose='Ensures clear financial terms, risk disclosure, and client data protection.',
        template_influence='Injects Disclosure Notice, Cover Summary, and Risk Notes into proposals.',
        disclosure_boundary='Proposal reflects declared offering and structured disclosure. It does not guarantee outcome or final underwriter approval.',
        verification_required=False,
    ),
    ArchetypeStandard(
        standard_key='STD-MIN-001',
        standard_name='Ethical Community Disclosure & Archival Continuity',
        applicable_archetypes=['community_ministry_steward', 'education_tutoring_steward'],
        operational_purpose='Preserves teaching lineage, pastoral accountability, and community memory.',
        template_influence='Shapes the Scripture Foundation, Reflection, and Continuity Notes sections.',
        disclosure_boundary='Teaching preserves declared interpretation. It does not manufacture absolute spiritual authority.',
        verification_required=False,
    ),
    ArchetypeStandard(
        standard_key='STD-IND-001',
        standard_name='ISO 17025 / ISO 13909 Sampling & Custody Continuity',
        applicable_archetypes=['skilled_trades_steward'],
        operational_purpose='Maintains exact physical custody replay, sampling precision, and uncertainty mapping.',
        template_influence='Dictates Custody Replay, Sampling Methodology, and Bounded Interpretation sections.',
        disclosure_boundary='Report preserves physical custody chain and declared method. It does not replace independent accreditation.',
        verification_required=True,
    )
]
