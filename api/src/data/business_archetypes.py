from enum import Enum
from typing import Optional, Dict, Any

class OperationalArchetype(str, Enum):
    EVENT_DRIVEN_TEMPORAL = "EventDrivenTemporal"
    TRUST_DRIVEN_LINEAGE = "TrustDrivenLineage"
    STATE_DRIVEN_VELOCITY = "StateDrivenVelocity"

ARCHETYPE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "commission_based_sales": {
        "default": {
            "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
            "confidence": "high",
            "notes": "All commission-based sales rely on trust and multi-step lineage."
        },
        "overrides": {}
    },
    "food_and_catering": {
        "default": {
            "archetype": OperationalArchetype.STATE_DRIVEN_VELOCITY,
            "confidence": "high",
            "notes": "Most food businesses operate on inventory/velocity (e.g., street vendors, bakers)."
        },
        "overrides": {
            "Catering Business": {
                "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
                "confidence": "high",
                "notes": "Catering is event-based, scheduled, and not pure velocity."
            }
        }
    },
    "retail_and_trading": {
        "default": {
            "archetype": OperationalArchetype.STATE_DRIVEN_VELOCITY,
            "confidence": "high",
            "notes": "Retail trading is velocity/inventory-driven (spaza, street vendors)."
        },
        "overrides": {}
    },
    "beauty_and_hair": {
        "default": {
            "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
            "confidence": "high",
            "notes": "Salons/barbers operate by appointment/time slots."
        },
        "overrides": {}
    },
    "education_and_training": {
        "default": {
            "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
            "confidence": "high",
            "notes": "Tutors/instructors operate on scheduled appointments."
        },
        "overrides": {}
    },
    "events_and_media": {
        "default": {
            "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
            "confidence": "medium",
            "notes": "Most event/media jobs are temporal, but some (e.g., photography) may be lineage."
        },
        "overrides": {
            "Photography": {
                "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
                "confidence": "low",
                "notes": "Photography can be event-driven or lineage (editing, delivery). Needs review."
            }
        }
    },
    "transport_and_delivery": {
        "default": {
            "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
            "confidence": "medium",
            "notes": "Most transport is booking/event-driven, but some may be regular service."
        },
        "overrides": {}
    },
    "construction_and_trades": {
        "default": {
            "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
            "confidence": "high",
            "notes": "Builders/repairs require trust, quotes, and sign-off."
        },
        "overrides": {}
    },
    "home_services": {
        "default": {
            "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
            "confidence": "medium",
            "notes": "General handyman is temporal, but some jobs are lineage (plumbing, electrical)."
        },
        "overrides": {
            "Plumbing": {
                "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
                "confidence": "high",
                "notes": "Plumbing repairs often require quotes, parts, and sign-off."
            },
            "Electrical Repairs": {
                "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
                "confidence": "high",
                "notes": "Electrical work is lineage due to safety and compliance."
            },
            "Roof Repairs": {
                "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
                "confidence": "high",
                "notes": "Roof repairs are lineage due to risk and staged work."
            }
        }
    },
    "fashion_and_clothing": {
        "default": {
            "archetype": OperationalArchetype.STATE_DRIVEN_VELOCITY,
            "confidence": "medium",
            "notes": "Most fashion is retail/velocity, but tailoring is temporal or lineage."
        },
        "overrides": {
            "Tailor": {
                "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
                "confidence": "medium",
                "notes": "Tailoring involves consultation, fitting, and delivery."
            },
            "Fashion Designer": {
                "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
                "confidence": "medium",
                "notes": "Designers may operate by project/event. Needs review."
            }
        }
    },
    "tech_and_digital": {
        "default": {
            "archetype": OperationalArchetype.EVENT_DRIVEN_TEMPORAL,
            "confidence": "medium",
            "notes": "Most tech jobs are project/event-based, but some are lineage (milestones)."
        },
        "overrides": {
            "Website Design": {
                "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
                "confidence": "medium",
                "notes": "Website/app development is milestone-based, trust lineage."
            },
            "App Development": {
                "archetype": OperationalArchetype.TRUST_DRIVEN_LINEAGE,
                "confidence": "medium",
                "notes": "App development is milestone-based, trust lineage."
            }
        }
    }
}

def resolve_business_archetype(category_key: str, business_line: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Returns the archetype mapping dict for the given category_key and optional business_line.
    Returns None if not found. Never raises.
    """
    cat = ARCHETYPE_REGISTRY.get(category_key)
    if not cat:
        return None
    if business_line and business_line in cat.get("overrides", {}):
        return cat["overrides"][business_line]
    return cat.get("default")
