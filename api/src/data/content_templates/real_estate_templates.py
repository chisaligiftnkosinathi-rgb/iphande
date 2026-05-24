REAL_ESTATE_TEMPLATES = [
    {
        "template_key": "property_viewing_invitation",
        "business_categories": ["commission_based_sales", "general_business"],
        "platforms": ["facebook", "whatsapp"],
        "goal_key": "request_quotes",
        "tone": "professional",
        "hook_pattern": "Looking for a home in {location}?",
        "body_pattern": "We have an available property that might be the right fit for your family.",
        "cta_pattern": "Send a message to schedule a viewing or request pricing details.",
        "stewardship_constraints": ["no hiding defects", "no high-pressure tactics", "transparent pricing communication"],
        "variables": ["location"]
    }
]
