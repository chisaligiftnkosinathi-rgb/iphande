# migrated from docs/registry.py
from typing import Dict, Any
from .commission_based_sales import COMMISSION_BASED_SALES_LINEAGE

LINEAGE_REGISTRY: Dict[str, Dict[str, Any]] = {
    "commission_based_sales": COMMISSION_BASED_SALES_LINEAGE
}

def get_lineage_definition(business_category_key: str) -> Dict[str, Any]:
    # ...existing code...

def list_all_lineages() -> Dict[str, Dict[str, Any]]:
    # ...existing code...
