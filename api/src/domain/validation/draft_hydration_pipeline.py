# migrated from docs/draft_hydration_pipeline.py
from typing import List, Dict, Any
from ..registry.document_schemas import (
    ValidatedDraft, CanonicalDraft, CanonicalSection,
    SectionOrigin, AppliedStandard
)
from ..registry.registry_loaders import RegistryLoader
from ..templates.template_section_registry import SectionMutability, SectionSemanticFamily

class DraftHydrationPipeline:
    """
    Transforms a ValidatedDraft into a CanonicalDraft.
    Injects standard disclosures, system-generated continuity blocks,
    and preserves mutability boundaries without reinterpreting steward meaning.
    """
    # ...existing code...
