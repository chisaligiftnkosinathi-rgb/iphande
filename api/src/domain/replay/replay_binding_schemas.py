# migrated from docs/replay_binding_schemas.py
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class ReplayBindingStrength(str, Enum):
    """
    Differentiates the structural weight of how an artifact binds to continuity.
    Prevents the system from treating all attachments as epistemologically equal.
    """
    DECLARATIVE = 'declarative'    # E.g., A promotional image, a self-authored reflection
    EVIDENTIARY = 'evidentiary'    # E.g., A signed job card, an uploaded payment receipt
    STRUCTURAL = 'structural'      # E.g., A formalized proposal or policy document
    DERIVED = 'derived'            # E.g., An AI summary, a system-generated thumbnail

class ArtifactType(str, Enum):
    DOCUMENT = 'document'
    MEDIA = 'media'

class ArtifactEventType(str, Enum):
    """
    Strictly descriptive events.
    These describe what happened to the artifact, not its truthfulness or authority.
    """
    # ...existing code...

class ArtifactBindingContract(BaseModel):
    # ...existing code...
