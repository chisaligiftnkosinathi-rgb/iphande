from fastapi import APIRouter, HTTPException
from src.data.business_categories import BUSINESS_CATEGORIES, get_business_category, list_business_categories

router = APIRouter(prefix="/api/v1/business-categories", tags=["Business Categories"])

@router.get("")
def get_all_business_categories():
    """Return all business categories."""
    return list_business_categories()

@router.get("/{category_key}")
def get_business_category_by_key(category_key: str):
    """Return a single business category by key."""
    category = get_business_category(category_key)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category
