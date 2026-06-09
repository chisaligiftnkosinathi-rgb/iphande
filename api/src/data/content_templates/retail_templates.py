RETAIL_TEMPLATES = [
    {
        "template_key": "retail_product_announcement",
        "business_categories": ["food_and_catering", "general_business"],
        "platforms": ["facebook", "whatsapp", "tiktok"],
        "goal_key": "promote_today",
        "tone": "clear",
        "hook_pattern": "New {product_name} now available.",
        "body_pattern": "We have freshly stocked {product_name} ready for you.",
        "cta_pattern": "Visit us at {location} or send a message to order.",
        "stewardship_constraints": ["no fake urgency", "accurate representation of stock"],
        "variables": ["product_name", "location"]
    }
]
