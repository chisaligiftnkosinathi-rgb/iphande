# migrated from docs/archetype_document_templates.py
from enum import Enum
from pydantic import BaseModel
from typing import List

class DocumentVisibility(str, Enum):
    # ...existing code...

class ReplayBindingMode(str, Enum):
    # ...existing code...

class RegistryVersion(BaseModel):
    # ...existing code...

ARCHETYPE_DOCUMENT_TEMPLATES_VERSION = RegistryVersion(
    registry_version="1.0.0",
    last_updated="2026-05-27",
    governance_revision="REV-001"
)

class ArchetypeDocumentTemplate(BaseModel):
    # ...existing code...

ARCHETYPE_DOCUMENT_TEMPLATES = [
    # ...existing code...
]
