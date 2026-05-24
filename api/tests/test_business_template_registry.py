from src.data.content_templates.registry import get_blueprints_for_goal

PRACTICAL_TEMPLATE_CASES = [
    ("beauty_salon_booking_slots", "beauty_and_hair", "get_bookings", "facebook"),
    ("car_wash_service_promo", "transport_and_delivery", "promote_today", "tiktok"),
    ("catering_event_booking", "food_and_catering", "get_bookings", "whatsapp"),
    ("cleaning_services_booking", "home_services", "get_bookings", "facebook"),
    ("tutoring_learning_support", "education_and_training", "build_trust", "whatsapp"),
]

def test_funeral_cover_request_quote_returns_funeral_blueprint_first():
    results = get_blueprints_for_goal(
        goal_key="request_quotes",
        business_category_key="commission_based_sales",
        platform="facebook"
    )

    assert len(results) > 0
    best_match = results[0]
    assert best_match["blueprint"]["template_key"] == "funeral_cover_family_protection"
    assert best_match["score"] == 25  # 10 (goal) + 10 (category) + 5 (platform)
    assert best_match["selection_reasons"]["business_category_match"] is True
    assert best_match["selection_reasons"]["platform_match"] is True

def test_unsupported_category_is_excluded():
    results = get_blueprints_for_goal(
        goal_key="request_quotes",
        business_category_key="beauty_and_hair"
    )
    assert not any(r["blueprint"]["template_key"] == "funeral_cover_family_protection" for r in results)

def test_blueprint_scoring_prefers_platform_match():
    match_results = get_blueprints_for_goal(
        goal_key="request_quotes",
        business_category_key="commission_based_sales",
        platform="facebook"
    )
    miss_results = get_blueprints_for_goal(
        goal_key="request_quotes",
        business_category_key="commission_based_sales",
        platform="instagram" # Unsupported platform
    )

    assert match_results[0]["score"] > miss_results[0]["score"]
    assert match_results[0]["selection_reasons"]["platform_match"] is True
    assert miss_results[0]["selection_reasons"]["platform_match"] is False

def test_practical_local_business_templates_are_selectable():
    for template_key, category_key, goal_key, platform in PRACTICAL_TEMPLATE_CASES:
        results = get_blueprints_for_goal(
            goal_key=goal_key,
            business_category_key=category_key,
            platform=platform,
        )

        assert results
        best_match = results[0]
        blueprint = best_match["blueprint"]
        assert blueprint["template_key"] == template_key
        assert best_match["score"] == 25
        assert best_match["selection_reasons"]["goal_match"] is True
        assert best_match["selection_reasons"]["business_category_match"] is True
        assert best_match["selection_reasons"]["platform_match"] is True

def test_practical_local_business_templates_have_governance_fields():
    expected_events = [
        "prompt_context_built",
        "template_selected",
        "public_caption_composed",
        "platform_format_applied",
        "content_generated",
    ]

    for template_key, category_key, goal_key, platform in PRACTICAL_TEMPLATE_CASES:
        results = get_blueprints_for_goal(
            goal_key=goal_key,
            business_category_key=category_key,
            platform=platform,
        )
        blueprint = results[0]["blueprint"]

        assert blueprint["template_key"] == template_key
        assert blueprint["business_line"]
        assert blueprint["tone"]
        assert blueprint["cta_style"]
        assert blueprint["sample_offer_details"]
        assert blueprint["stewardship_constraints"]
        assert blueprint["variables"]
        assert blueprint["replay_event_expectations"] == expected_events
