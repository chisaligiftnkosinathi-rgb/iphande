from typing import Dict, Any
from .commission_based_sales import COMMISSION_BASED_SALES_LINEAGE

LINEAGE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "commission_based_sales": COMMISSION_BASED_SALES_LINEAGE
}

def get_lineage_definition(business_category_key: str) -> Dict[str, Any]:
    """
    Returns the constitutional lineage definition for a given business category.
    If unknown, provides a highly restricted default surface.
    """
    return LINEAGE_REGISTRY.get(business_category_key, {
        "lineage_key": "default",
        "name": "Default Universal Lineage",
        "capabilities": ["profile", "stewardship", "replay"],
        "workflow_order": [],
        "evidence_types": [],
        "events": []
    })

def list_all_lineages() -> Dict[str, Dict[str, Any]]:
    return LINEAGE_REGISTRY
