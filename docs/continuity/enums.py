from enum import Enum


class OpportunityArchetype(str, Enum):
    """
    Defines the categorized types of opportunities available on iPhande.
    """
    WORK = "work"
    SERVICE = "service"
    SALES = "sales"
    TRAINING = "training"
    COMMUNITY = "community"
    FAITH = "faith"
    APPRENTICESHIP = "apprenticeship"
    PARTNERSHIP = "partnership"
