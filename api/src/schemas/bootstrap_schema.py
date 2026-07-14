from pydantic import BaseModel
from typing import List, Optional, Any
from src.schemas.dashboard_schema import DashboardResponse

class IdentitySchema(BaseModel):
    id: str
    email: str
    emailVerified: bool

class BusinessSchema(BaseModel):
    id: str
    slug: str
    displayName: str
    trust: int
    plan: str
    status: str
    permissions: List[str]
    featureFlags: List[str]

class SystemSchema(BaseModel):
    version: str
    environment: str
    maintenance: bool

class ApplicationState(BaseModel):
    stage: str

class SetupState(BaseModel):
    exists: bool
    completed: bool
    current_step: int
    total_steps: int

class SubscriptionState(BaseModel):
    status: str
    plan: str

class WorkspaceSnapshotSchema(BaseModel):
    visibility: str
    category: str
    location: str
    subscription_plan: str

class WorkspaceSummarySchema(BaseModel):
    leads: int
    quotes: int
    views: int
    followups: int

class WorkspaceSchema(BaseModel):
    priority: str
    snapshot: WorkspaceSnapshotSchema
    summary: WorkspaceSummarySchema

class BootstrapResponse(BaseModel):
    session: Any = {}
    identity: IdentitySchema
    business: Any = {}
    application: ApplicationState
    setup: SetupState
    subscription: SubscriptionState
    workspace: Optional[WorkspaceSchema] = None
    businesses: List[BusinessSchema]
    selectedBusinessId: Optional[str]
    permissions: List[str]
    featureFlags: List[str]
    navigation: List[Any]
    platformRole: str
    dashboard: Optional[DashboardResponse] = None
    policy: Any
    system: SystemSchema
