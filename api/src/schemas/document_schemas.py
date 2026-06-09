# migrated from docs/document_schemas.py
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from ..templates.template_section_registry import SectionSemanticFamily, SectionMutability

class ValidationSeverity(str, Enum):
    # ...existing code...

class SectionOrigin(str, Enum):
    # ...existing code...

class DraftSection(BaseModel):
    # ...existing code...

class DocumentDraftPayload(BaseModel):
    # ...existing code...

class AppliedStandard(BaseModel):
    # ...existing code...

class HydratedSection(DraftSection):
    # ...existing code...

class ValidatedDraft(BaseModel):
    # ...existing code...
