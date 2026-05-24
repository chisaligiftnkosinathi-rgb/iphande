SERVICES_TEMPLATES = [
    {
        "template_key": "service_booking_availability",
        "business_categories": ["beauty_and_hair", "general_business"],
        "platforms": ["facebook", "whatsapp"],
        "goal_key": "get_bookings",
        "tone": "professional",
        "hook_pattern": "Reliable {service_name} services available in {location}.",
        "body_pattern": "We are currently accepting new bookings. Let us provide you with high-quality service you can trust.",
        "cta_pattern": "Message us to secure your spot today.",
        "stewardship_constraints": ["no fake scarcity", "honest representation of availability"],
        "variables": ["service_name", "location"]
    },
    {
        "template_key": "service_quote_follow_up",
        "business_categories": ["general_business"],
        "platforms": ["whatsapp"],
        "goal_key": "follow_up_customers",
        "tone": "friendly",
        "hook_pattern": "Hi {customer_name}, following up on your recent quote request.",
        "body_pattern": "I want to ensure you have all the information you need to make a decision about {service_name}.",
        "cta_pattern": "Let me know if you have any questions or are ready to proceed.",
        "stewardship_constraints": [
            "no pressure", "respect the customer's timeline", "focus on helpfulness"
        ],
        "variables": ["customer_name", "service_name"]
    }
]
