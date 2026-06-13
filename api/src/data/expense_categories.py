# Deterministic expense categories by business archetype

DEFAULT_EXPENSE_CATEGORIES = [
    "Transport",
    "Fuel",
    "Materials",
    "Tools",
    "Equipment",
    "Electricity",
    "Water",
    "Rent",
    "Marketing",
    "Data & Airtime",
    "Salaries",
    "Maintenance",
    "Other"
]

ARCHETYPE_EXPENSE_CATEGORIES = {
    "food_vendor": [
        "Ingredients",
        "Packaging",
        "Gas",
        "Electricity",
        "Transport",
        "Other"
    ],
    "plumber": [
        "PVC Pipe",
        "Fittings",
        "Transport",
        "Tools",
        "Consumables",
        "Other"
    ],
    "content_creator": [
        "Data & Airtime",
        "Equipment",
        "Software",
        "Travel",
        "Marketing",
        "Other"
    ],
    "hair_salon": [
        "Hair Products",
        "Electricity",
        "Water",
        "Equipment",
        "Rent",
        "Other"
    ],
    "mechanic_auto": [
        "Parts",
        "Tools",
        "Oil & Fluids",
        "Consumables",
        "Transport",
        "Rent",
        "Other"
    ],
}

def get_expense_categories_for_archetype(archetype_key: str | None) -> list[str]:
    """Return deterministic expense categories based on the business archetype."""
    if not archetype_key:
        return DEFAULT_EXPENSE_CATEGORIES
    
    # Simple mapping
    key = archetype_key.lower()
    
    if "food" in key or "catering" in key:
        return ARCHETYPE_EXPENSE_CATEGORIES["food_vendor"]
    if "plumb" in key:
        return ARCHETYPE_EXPENSE_CATEGORIES["plumber"]
    if "content" in key or "media" in key:
        return ARCHETYPE_EXPENSE_CATEGORIES["content_creator"]
    if "hair" in key or "salon" in key or "beauty" in key:
        return ARCHETYPE_EXPENSE_CATEGORIES["hair_salon"]
    if "mechanic" in key or "auto" in key:
        return ARCHETYPE_EXPENSE_CATEGORIES["mechanic_auto"]
        
    return ARCHETYPE_EXPENSE_CATEGORIES.get(key, DEFAULT_EXPENSE_CATEGORIES)
