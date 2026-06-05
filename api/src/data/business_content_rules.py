# iPhande deterministic content rules for all business categories

# iPhande deterministic content rules for all business categories

# Platform-aware deterministic rules
PLATFORM_CONTENT_RULES = {
    "facebook": {
        "caption_format": "{hook}\n{offer}\n{trust_builder}\n{call_to_action}\n{quote_request_prompt}\n{hashtags}",
        "notes": "Facebook supports longer captions, hashtags, and line breaks. Use clear sections. Avoid clickbait."
    },
    "whatsapp": {
        "caption_format": "{hook}\n{offer}\n{call_to_action}\n{quote_request_prompt}",
        "notes": "WhatsApp is for direct, short, actionable posts. No hashtags. Use clear instructions."
    },
    "tiktok": {
        "caption_format": "{hook} {offer} {call_to_action} {quote_request_prompt} {hashtags}",
        "notes": "TikTok captions are short. Focus on hook and CTA. Hashtags are important."
    },
}

BUSINESS_CONTENT_RULES = {
    "general_business": {
        "name": "General Business",
        "default_cta": "Contact us today.",
        "default_prompt": "Tell people what you offer and how they can reach you.",
        "profile_guidance": [
            "Add your business name.",
            "Add your location.",
            "Add your contact details.",
            "Explain what you offer clearly."
        ],
        "suggested_tags": ["business", "services", "local_business"],
        "goal_prompts": {
            "promote_today": "Share what you are offering today.",
            "get_bookings": "Invite customers to book your service.",
            "share_price_list": "Share your prices clearly.",
            "announce_availability": "Tell customers when you are available.",
            "follow_up_customers": "Remind past customers to contact you again.",
            "build_trust": "Share proof of your work or customer feedback."
        }
    },
    "food_and_catering": {
        "name": "Food & Catering",
        "default_cta": "Place your order today.",
        "default_prompt": "Share your food offering, price, location, and ordering instructions.",
        "profile_guidance": [
            "Add your menu.",
            "Add your prices.",
            "Add your delivery or collection options.",
            "Show clear food photos."
        ],
        "suggested_tags": ["food", "catering", "kasi_food", "orders", "delivery"],
        "goal_prompts": {
            "promote_today": "Post today’s meals, specials, or fresh items.",
            "get_bookings": "Invite customers to book catering early.",
            "share_price_list": "Share your menu and prices clearly.",
            "announce_availability": "Tell customers when orders are open.",
            "follow_up_customers": "Remind customers to place repeat orders.",
            "build_trust": "Share food photos, reviews, or hygiene care."
        }
    },
    "beauty_and_hair": {
        "name": "Beauty & Hair",
        "default_cta": "Book your appointment today.",
        "default_prompt": "Share your service, available slots, location, and booking method.",
        "profile_guidance": [
            "Show before and after work.",
            "Add booking times.",
            "Add prices.",
            "State if you offer mobile service."
        ],
        "suggested_tags": ["beauty", "hair", "barber", "nails", "bookings"],
        "goal_prompts": {
            "promote_today": "Show today’s beauty or grooming offer.",
            "get_bookings": "Invite clients to book available slots.",
            "share_price_list": "Share your service list and prices.",
            "announce_availability": "Tell clients your open booking times.",
            "follow_up_customers": "Remind clients to book again.",
            "build_trust": "Share before/after work or client feedback."
        }
    },
    "commission_based_sales": {
        "name": "Commission-Based Sales",
        "default_cta": "Send a message to learn more.",
        "default_prompt": "Explain the offer clearly, who it helps, and how someone can contact you.",
        "profile_guidance": [
            "State what product or service you represent.",
            "Explain who the offer is for.",
            "Add your contact method.",
            "Use simple, honest language.",
            "Avoid making promises you cannot prove."
        ],
        "suggested_tags": [
            "commission",
            "sales",
            "referrals",
            "leads",
            "community_sales",
            "agent"
        ],
        "goal_prompts": {
            "promote_today": "Share the offer you are promoting today and who it can help.",
            "get_bookings": "Invite people to book a call or appointment with you.",
            "share_price_list": "Share the available packages, pricing, or options clearly.",
            "announce_availability": "Tell people when you are available for calls, visits, or consultations.",
            "follow_up_customers": "Remind interested people to complete their application, signup, or purchase.",
            "build_trust": "Share your role, experience, proof of representation, or customer success stories without exaggeration."
        }
    },
    "retail_and_trading": {
        "name": "Retail & Trading",
        "default_cta": "Send a message to confirm availability.",
        "default_prompt": "Share what is available, the price if known, where customers can find you, and how they can order.",
        "profile_guidance": [
            "Add product names clearly.",
            "State your location or collection point.",
            "Share prices only when they are accurate.",
            "Avoid fake scarcity or exaggerated claims."
        ],
        "suggested_tags": ["retail", "local_business", "spaza", "reseller", "available_now"],
        "goal_prompts": {
            "promote_today": "Share today's available products clearly.",
            "get_bookings": "Invite customers to reserve or arrange collection.",
            "share_price_list": "Share prices clearly and honestly.",
            "announce_availability": "Tell customers what is currently in stock.",
            "follow_up_customers": "Remind interested customers to confirm availability before coming.",
            "build_trust": "Share reliable stock, pricing, or service information without exaggeration."
        }
    },
    "tech_digital_services": {
        "name": "Technology & Digital Services",
        "default_cta": "Send a message to discuss your digital needs.",
        "default_prompt": "Explain the technical solution you provide, who it helps, and how they can contact you.",
        "profile_guidance": [
            "State your core technical services clearly.",
            "Share examples of past projects or solved problems.",
            "Explain your process and timelines.",
            "Use clear language, avoiding unnecessary jargon."
        ],
        "suggested_tags": ["TechSupport", "WebDesign", "AppDevelopment", "DigitalServices", "IT"],
        "goal_prompts": {
            "promote_today": "Share a specific tech service or digital solution you are offering today.",
            "get_bookings": "Invite businesses to book a technical consultation or system review.",
            "share_price_list": "Share the starting prices for your web design, app development, or IT support packages.",
            "announce_availability": "Tell clients your capacity for new projects or emergency IT support.",
            "follow_up_customers": "Remind past clients about system maintenance, backups, or software upgrades.",
            "build_trust": "Share a brief story about a complex technical problem you successfully solved for a client.",
            "request_quotes": "Invite businesses to request a quote for a custom website, application, or business system."
        }
    }
}

REQUIRED_GOAL_KEYS = {
    "promote_today",
    "get_bookings",
    "share_price_list",
    "announce_availability",
    "follow_up_customers",
    "build_trust",
    "request_quotes",
}

def get_content_rules(category_key: str | None):
    if not category_key:
        return BUSINESS_CONTENT_RULES["general_business"]
    return BUSINESS_CONTENT_RULES.get(
        category_key,
        BUSINESS_CONTENT_RULES["general_business"],
    )

def get_prompt_for_goal(category_key: str | None, goal_key: str | None):
    rules = get_content_rules(category_key)
    if not goal_key:
        return rules["default_prompt"]
    return rules.get("goal_prompts", {}).get(
        goal_key,
        rules["default_prompt"],
    )

def get_suggested_tags(category_key: str | None):
    return get_content_rules(category_key).get("suggested_tags", [])

def get_profile_guidance(category_key: str | None):
    return get_content_rules(category_key).get("profile_guidance", [])
