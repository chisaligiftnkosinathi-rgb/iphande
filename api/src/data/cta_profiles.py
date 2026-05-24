CTA_PROFILES = {
    "promote_today": {
        "default": "Contact us for more information.",
        "whatsapp": "Message us on WhatsApp to confirm availability.",
        "facebook": "Send us a message to order or ask a question.",
    },
    "request_quotes": {
        "default": "Send a message to learn more.",
        "whatsapp": "Message us on WhatsApp to request a quote.",
        "facebook": "Send us a message for more information.",
    },
    "get_bookings": {
        "default": "Contact us to book.",
        "whatsapp": "Message us on WhatsApp to book.",
        "facebook": "Send us a message to secure your booking.",
    },
    "booking_interest": {
        "default": "Contact us to book.",
        "whatsapp": "Message us on WhatsApp to book.",
        "facebook": "Send us a message to secure your booking.",
    },
    "share_price_list": {
        "default": "Contact us to confirm the latest price.",
        "whatsapp": "Message us on WhatsApp to confirm price and availability.",
        "facebook": "Send us a message if you have a question about the price list.",
    },
    "announce_availability": {
        "default": "Contact us to confirm availability.",
        "whatsapp": "Message us on WhatsApp to confirm availability.",
        "facebook": "Send us a message to check availability.",
    },
    "awareness": {
        "default": "Learn more about our services.",
        "whatsapp": "Message us if you would like more information.",
        "facebook": "Follow our page to learn more.",
    },
    "build_trust": {
        "default": "Contact us if you would like more information.",
        "whatsapp": "Message us if you would like more information.",
        "facebook": "Follow our page to learn more.",
    },
}

def get_cta(goal_key: str, platform: str) -> str:
    profile = CTA_PROFILES.get(goal_key)
    if not profile:
        return "Contact us for more information."
    return (
        profile.get(platform)
        or profile.get("default")
        or "Contact us for more information."
    )
