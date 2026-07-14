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

class BootstrapResponse(BaseModel):
    identity: IdentitySchema
    businesses: List[BusinessSchema]
    selectedBusinessId: Optional[str]
    permissions: List[str]
    featureFlags: List[str]
    navigation: List[Any]
    platformRole: str
    dashboard: Optional[DashboardResponse] = None
    policy: Any
    system: SystemSchema
