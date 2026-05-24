from fastapi import APIRouter
from src.data.business_content_rules import BUSINESS_CONTENT_RULES, get_content_rules

router = APIRouter()

@router.get("/api/v1/business-content-rules")
def list_business_content_rules():
    return BUSINESS_CONTENT_RULES

@router.get("/api/v1/business-content-rules/{category_key}")
def get_business_content_rule(category_key: str):
    return get_content_rules(category_key)
