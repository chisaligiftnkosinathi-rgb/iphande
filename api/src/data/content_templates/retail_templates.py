RETAIL_TEMPLATES = [
    {
        "template_key": "retail_product_announcement",
        "business_categories": ["retail_and_trading", "food_and_catering"],
        "platforms": ["facebook", "whatsapp", "tiktok"],
        "goal_key": "promote_today",
        "tone": "clear",
        "hook_pattern": "New {product_name} now available.",
        "body_pattern": "We have freshly stocked {product_name} ready for you.",
        "cta_pattern": "Visit us at {location} or send a message to order.",
        "stewardship_constraints": ["no fake urgency", "accurate representation of stock"],
        "variables": ["product_name", "location"]
    },
    {
        "template_key": "retail_price_list_update",
        "business_categories": ["retail_and_trading"],
        "platforms": ["facebook", "whatsapp"],
        "goal_key": "share_price_list",
        "tone": "practical",
        "hook_pattern": "Here is our latest price list for {product_category}.",
        "body_pattern": "Prices are shared clearly so customers can decide before visiting or ordering.",
        "cta_pattern": "Message us for availability or visit us at {location}.",
        "stewardship_constraints": ["transparent pricing", "no hidden costs", "accurate availability"],
        "variables": ["product_category", "location"]
    },
    {
        "template_key": "retail_stock_availability",
        "business_categories": ["retail_and_trading"],
        "platforms": ["facebook", "whatsapp", "tiktok"],
        "goal_key": "announce_availability",
        "tone": "friendly",
        "hook_pattern": "{product_name} is available at {location}.",
        "body_pattern": "Customers are welcome to ask about stock, price, and collection details before ordering.",
        "cta_pattern": "Send a message if you would like us to confirm availability.",
        "stewardship_constraints": ["no pressure selling", "accurate stock claims", "clear ordering instructions"],
        "variables": ["product_name", "location"]
    }
]
