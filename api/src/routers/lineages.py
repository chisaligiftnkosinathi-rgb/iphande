from fastapi import APIRouter

from src.lineages import get_lineage_definition, list_all_lineages

router = APIRouter(prefix="/api/v1/lineages", tags=["lineages"])


@router.get("")
def list_lineages():
    return {
        "lineages": list_all_lineages(),
        "truth_boundary": "Lineages declare permitted capabilities. They do not prove activity occurred.",
    }


@router.get("/{business_category_key}")
def get_lineage(business_category_key: str):
    lineage = get_lineage_definition(business_category_key)
    return {
        "lineage": lineage,
        "truth_boundary": "Frontend may render declared capabilities, but replay remains the record of what actually happened.",
    }
