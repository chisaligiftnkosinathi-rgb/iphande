from src.data.content_templates.registry import get_blueprints_for_goal

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
