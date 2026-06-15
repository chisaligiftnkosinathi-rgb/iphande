from enum import Enum

class OpportunityArchetype(str, Enum):
    WORK = "work"
    SERVICE = "service"
    SALES = "sales"
    TRAINING = "training"
    COMMUNITY = "community"
    FAITH = "faith"
    APPRENTICESHIP = "apprenticeship"
    PARTNERSHIP = "partnership"

class SystemRole(str, Enum):
    PLATFORM_ADMIN = "platform_admin"
    SYSTEM_CREATOR = "system_creator"
    STEWARD = "steward"
    VERIFIED_STEWARD = "verified_steward"
    BUSINESS_OWNER = "business_owner"
    COMMUNITY_MEMBER = "community_member"
