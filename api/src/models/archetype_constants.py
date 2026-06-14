# archetype_constants.py

TECH_DIGITAL_ARCHETYPE_V1 = "tech_digital_v1"

SEEDED_SERVICE_TEMPLATES = [
    "Website Starter",
    "Business Visibility",
    "Mobile App Development",
    "Custom Software",
    "Database Design",
    "Business Automation",
    "VBA Automation",
    "IT Support",
    "Training",
    "Advisory"
]

SEEDED_DOCUMENT_TEMPLATES = [
    "Quote",
    "Invoice",
    "Receipt",
    "Proposal",
    "Service Agreement",
    "Proof of Work",
    "Business Profile",
    "Portfolio"
]

SEEDED_OPPORTUNITY_CATEGORIES = [
    "Technology",
    "Website",
    "Mobile App",
    "IT Support",
    "Training",
    "Digital Marketing",
    "Automation",
    "Database"
]

ARCHETYPES = {
    TECH_DIGITAL_ARCHETYPE_V1: {
        "archetype_key": TECH_DIGITAL_ARCHETYPE_V1,
        "display_name": "Technology & Digital Services",
        "service_templates": SEEDED_SERVICE_TEMPLATES,
        "document_templates": SEEDED_DOCUMENT_TEMPLATES,
        "opportunity_categories": SEEDED_OPPORTUNITY_CATEGORIES
    }
}
