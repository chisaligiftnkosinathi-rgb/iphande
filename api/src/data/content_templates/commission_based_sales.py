COMMISSION_BASED_SALES_TEMPLATE = {
    "key": "commission_based_sales",
    "allowed_tones": ["professional", "friendly", "clear"],
    "trust_builders": [
        "Clear information is provided before you decide.",
        "You can ask questions before choosing an option.",
    ],
    "quote_prompts": {
        "request_quotes": "This post is designed to invite quote requests.",
        "awareness": "This post is designed to help people understand the offer.",
    },
    "platform_emphasis": {
        "facebook": "Use clear sections and simple language.",
        "whatsapp": "Keep the message direct and action-oriented.",
        "instagram": "Keep the caption short and easy to scan.",
    },
    "prohibited_phrases": [
        "limited time only",
        "guaranteed approval",
        "everyone qualifies",
        "act now before it is too late",
        "best deal ever",
    ],
}
