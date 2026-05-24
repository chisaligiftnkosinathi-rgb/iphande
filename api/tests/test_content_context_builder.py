from src.services.content_context_builder import build_generation_context
from src.models.profile import Profile

def test_build_generation_context_applies_funeral_cover_constraints():
    profile = Profile(
        name="Safe Families Broker",
        business_category_key="commission_based_sales",
        business_line="Funeral Cover",
        operating_area="Durban",
    )

    context = build_generation_context(
        profile=profile,
        business_category_key="commission_based_sales",
        business_line="Funeral Cover",
        platform="whatsapp",
        goal_key="request_quotes",
        offer_details="Affordable family plans",
        tone="empathetic",
    )

    assert "no fear manipulation" in context["stewardship_constraints"]
    assert "never use exaggerated guarantees" in context["stewardship_constraints"]
    assert context["business_identity"]["name"] == "Safe Families Broker"
    assert context["location_context"] == "Operating in Durban"

def test_build_generation_context_handles_missing_profile():
    context = build_generation_context(
        profile=None, business_category_key="general_services", business_line="Plumbing",
        platform="facebook", goal_key="get_bookings", offer_details="Fix leaky pipes", tone="professional"
    )
    assert context["business_identity"]["name"] == "Business Owner"
    assert context["location_context"] == ""
