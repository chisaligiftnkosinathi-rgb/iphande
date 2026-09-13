"""
Standardized Multi-Business Categories Registry
Taxonomy supporting Retail, Services, Wholesale, and Digital goods across South Africa.
"""
from typing import List, Dict, Any

TAXONOMY: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # 1. PHYSICAL PRODUCTS (Retail & Wholesale)
    # -------------------------------------------------------------
    {
        "id": "food_groceries",
        "name": "Food & Groceries",
        "business_types": ["retail", "wholesale"],
        "icon": "fast-food-outline",
        "subcategories": [
            {"id": "fresh_produce", "name": "Fresh Fruits & Vegetables"},
            {"id": "maize_grains", "name": "Maize Meal, Rice & Grains"},
            {"id": "meat_poultry", "name": "Butchery, Meat & Poultry"},
            {"id": "snacks_beverages", "name": "Snacks, Cold Drinks & Beverages"},
            {"id": "spices_condiments", "name": "Cooking Oil, Spices & Sauces"},
            {"id": "canned_dry_goods", "name": "Canned Goods & Pantry Staples"},
        ],
    },
    {
        "id": "fashion_apparel",
        "name": "Fashion & Apparel",
        "business_types": ["retail", "wholesale"],
        "icon": "shirt-outline",
        "subcategories": [
            {"id": "traditional_wear", "name": "Traditional & Cultural Attire"},
            {"id": "streetwear_casual", "name": "Township Streetwear & Casual"},
            {"id": "shoes_sneakers", "name": "Shoes, Boots & Sneakers"},
            {"id": "accessories_bags", "name": "Handbags, Caps & Accessories"},
            {"id": "workwear_uniforms", "name": "Workwear, PPE & School Uniforms"},
        ],
    },
    {
        "id": "hardware_building",
        "name": "Hardware & Building Materials",
        "business_types": ["retail", "wholesale"],
        "icon": "hammer-outline",
        "subcategories": [
            {"id": "cement_aggregates", "name": "Cement, Sand & Aggregates"},
            {"id": "hand_power_tools", "name": "Hand Tools & Power Tools"},
            {"id": "electrical_hardware", "name": "Cables, Switches & Lighting"},
            {"id": "plumbing_hardware", "name": "Pipes, Fittings & Geysers"},
            {"id": "roofing_timber", "name": "Corrugated Sheets & Timber"},
            {"id": "paint_coatings", "name": "Paints, Sealants & Waterproofing"},
        ],
    },
    {
        "id": "health_beauty",
        "name": "Health & Beauty",
        "business_types": ["retail", "wholesale"],
        "icon": "sparkles-outline",
        "subcategories": [
            {"id": "hair_care_wigs", "name": "Hair Extensions, Braids & Wigs"},
            {"id": "skincare_lotions", "name": "Skincare, Soaps & Lotions"},
            {"id": "perfumes_fragrances", "name": "Perfumes & Fragrance Oils"},
            {"id": "cosmetics_makeup", "name": "Cosmetics & Makeup"},
            {"id": "herbal_wellness", "name": "Herbal Teas & Natural Remedies"},
        ],
    },
    {
        "id": "electronics_appliances",
        "name": "Electronics & Power",
        "business_types": ["retail", "wholesale"],
        "icon": "flash-outline",
        "subcategories": [
            {"id": "phones_accessories", "name": "Smartphones, Chargers & Cables"},
            {"id": "solar_backup_power", "name": "Solar Panels, Batteries & Inverters"},
            {"id": "audio_sound", "name": "Bluetooth Speakers, Radios & Sound"},
            {"id": "home_appliances", "name": "Kettles, Irons & Small Appliances"},
        ],
    },

    # -------------------------------------------------------------
    # 2. LOCAL SERVICES & ARTISANS
    # -------------------------------------------------------------
    {
        "id": "home_construction_services",
        "name": "Home & Construction Services",
        "business_types": ["service"],
        "icon": "construct-outline",
        "subcategories": [
            {"id": "plumbing_services", "name": "Plumbers & Drain Cleaning"},
            {"id": "electrical_services", "name": "Electricians & Wiring"},
            {"id": "tiling_paving", "name": "Tiling, Plastering & Paving"},
            {"id": "painting_decorating", "name": "Painting & Waterproofing"},
            {"id": "welding_gate_repair", "name": "Welding, Burglar Bars & Gates"},
            {"id": "carpentry_cabinetry", "name": "Carpentry & Kitchen Fitting"},
        ],
    },
    {
        "id": "auto_transport_services",
        "name": "Auto & Transport Services",
        "business_types": ["service"],
        "icon": "car-outline",
        "subcategories": [
            {"id": "mobile_mechanics", "name": "Mobile Mechanics & Engine Repairs"},
            {"id": "tyre_fitment", "name": "Tyre Repair, Puncture & Wheel Alignment"},
            {"id": "panelbeating_spray", "name": "Panel Beating & Spray Painting"},
            {"id": "car_wash_valet", "name": "Car Wash & Auto Detailing"},
            {"id": "bakkie_hire_logistics", "name": "Bakkie Hire & Moving / Furniture Transport"},
        ],
    },
    {
        "id": "events_hospitality_services",
        "name": "Events & Hospitality",
        "business_types": ["service"],
        "icon": "wine-outline",
        "subcategories": [
            {"id": "catering_spitbraai", "name": "Catering & Spitbraai Services"},
            {"id": "sound_dj_hire", "name": "Sound Systems, Lighting & DJ Hire"},
            {"id": "photography_video", "name": "Photography & Videography"},
            {"id": "tents_deco_hire", "name": "Marquees, Chairs, Tables & Decor Hire"},
            {"id": "event_baking_cakes", "name": "Event Cakes, Pastries & Platters"},
        ],
    },
    {
        "id": "personal_beauty_services",
        "name": "Personal Care & Beauty",
        "business_types": ["service"],
        "icon": "cut-outline",
        "subcategories": [
            {"id": "hair_braiding_barber", "name": "Hair Braiding, Dreadlocks & Barbers"},
            {"id": "nail_lash_artists", "name": "Nail Techs & Lash Technicians"},
            {"id": "makeup_artists", "name": "Bridal & Special Occasion Makeup"},
            {"id": "tailoring_alterations", "name": "Tailors, Dressmaking & Alterations"},
            {"id": "fitness_training", "name": "Personal Trainers & Fitness Instructors"},
        ],
    },
    {
        "id": "professional_business_services",
        "name": "Professional & Business Services",
        "business_types": ["service"],
        "icon": "briefcase-outline",
        "subcategories": [
            {"id": "cipc_tax_services", "name": "CIPC Registration, Tax & Bookkeeping"},
            {"id": "graphic_logo_design", "name": "Branding, Logo Design & Signage"},
            {"id": "printing_embroidery", "name": "Flyer Printing, T-Shirt Printing & Embroidery"},
            {"id": "it_pc_repair", "name": "Computer Repairs, Wifi & Software Setup"},
        ],
    },

    # -------------------------------------------------------------
    # 3. DIGITAL GOODS & ASSETS
    # -------------------------------------------------------------
    {
        "id": "business_finance_digital",
        "name": "Business & Finance Tools",
        "business_types": ["digital"],
        "icon": "calculator-outline",
        "subcategories": [
            {"id": "spreadsheet_templates", "name": "Cash Flow & Bookkeeping Spreadsheets"},
            {"id": "quotation_invoices", "name": "Professional Invoice & Quotation Templates"},
            {"id": "business_plans_proposals", "name": "Funding & Tender Business Proposal Blueprints"},
        ],
    },
    {
        "id": "education_study_guides",
        "name": "Education & Study Materials",
        "business_types": ["digital"],
        "icon": "school-outline",
        "subcategories": [
            {"id": "matric_past_papers", "name": "Matric Exam Prep & Study Packs"},
            {"id": "language_learning", "name": "South African Language Guides"},
            {"id": "trade_manuals", "name": "Artisan & Technical How-To Manuals"},
        ],
    },
    {
        "id": "creative_media_assets",
        "name": "Creative & Media Assets",
        "business_types": ["digital"],
        "icon": "musical-notes-outline",
        "subcategories": [
            {"id": "music_beats_stems", "name": "Amapiano/Afrobeats Instrumentals & Audio Stems"},
            {"id": "design_flyer_templates", "name": "Canva / Photoshop Event Flyer Templates"},
            {"id": "social_media_kits", "name": "Social Media Marketing Bundles"},
        ],
    },
]

def get_all_categories() -> List[Dict[str, Any]]:
    return TAXONOMY

def get_categories_by_business_type(business_type: str) -> List[Dict[str, Any]]:
    return [c for c in TAXONOMY if business_type in c.get("business_types", [])]
