from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from src.constants.categories import get_all_categories, get_categories_by_business_type

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_categories(
    business_type: Optional[str] = Query(None, description="Filter by business type: retail, service, wholesale, digital")
):
    """
    Returns the canonical product and service taxonomy for iPhande.
    Used for frontend marketplace filters and merchant onboarding selection.
    """
    if business_type:
        valid_types = ["retail", "service", "wholesale", "digital"]
        if business_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid business_type '{business_type}'. Must be one of: {', '.join(valid_types)}"
            )
        return get_categories_by_business_type(business_type)
    return get_all_categories()


@router.get("/{business_type}", response_model=List[Dict[str, Any]])
def get_categories_for_type(business_type: str):
    """
    Returns categories strictly matching the specified business type.
    """
    valid_types = ["retail", "service", "wholesale", "digital"]
    if business_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid business_type '{business_type}'. Must be one of: {', '.join(valid_types)}"
        )
    return get_categories_by_business_type(business_type)
