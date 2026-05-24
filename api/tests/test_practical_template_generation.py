from src.services.content_post_service import generate_content_post


def test_beauty_salon_alias_selects_governed_blueprint():
    result = generate_content_post(
        {
            "business_owner_id": "BO003",
            "business_category_key": "beauty_salon",
            "business_line": "Beauty Salon",
            "platform": "facebook",
            "goal_key": "request_bookings",
            "offer_details": "Hair styling, nails, and beauty treatments available this week.",
            "location": "Pretoria",
            "contact_method": "WhatsApp",
            "tone": "friendly",
        }
    )

    assert result["business_category_key"] == "beauty_and_hair"
    assert result["goal_key"] == "get_bookings"
    assert result["template_key"] == "beauty_salon_booking_slots"
    assert "Beauty Salon bookings are open in Pretoria." in result["caption"]
    assert "Hair styling, nails, and beauty treatments" in result["caption"]

    template_selected = next(
        event for event in result["events"] if event["event_type"] == "template_selected"
    )
    assert template_selected["payload"]["template_key"] == "beauty_salon_booking_slots"
    assert template_selected["payload"]["blueprint_selected"] is True
