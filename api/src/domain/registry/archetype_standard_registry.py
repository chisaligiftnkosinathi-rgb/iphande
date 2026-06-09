# migrated from docs/archetype_standard_registry.py
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
    # ...existing code...

ARCHETYPE_STANDARD_REGISTRY = [
    # ...existing code...
]
