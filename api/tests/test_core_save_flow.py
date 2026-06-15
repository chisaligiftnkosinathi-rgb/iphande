import pytest
from sqlalchemy.orm import Session
from src.models.profile import Profile
from src.models.opportunity import Opportunity
from src.models.enums import OpportunityArchetype

# We use the existing override_get_db and engine from your test setup
from tests.test_quote_request_continuity import TestingSessionLocal, engine, Base

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def test_core_save_flow_profile_to_opportunity():
    db: Session = TestingSessionLocal()
    try:
        # 1. CREATE THE ROOT (The Profile/Steward)
        new_profile = Profile(
            name="Mandla Auto Repairs",
            slug="mandla-auto",
            email="mandla@example.com",
            is_public=True,
            short_bio="Serving Emalahleni with honest repairs."
        )
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)

        assert new_profile.id is not None
        assert new_profile.slug == "mandla-auto"

        # 2. CREATE THE FRUIT (The Opportunity attached to the Profile)
        new_opportunity = Opportunity(
            created_by_profile_id=new_profile.id, # MUST link to the root
            title="Assistant Mechanic Needed",
            town_or_city="Emalahleni",
            category_key="work"
        )
        db.add(new_opportunity)
        db.commit()
        db.refresh(new_opportunity)

        assert new_opportunity.id is not None
        assert new_opportunity.created_by_profile_id == new_profile.id
        assert new_opportunity.title == "Assistant Mechanic Needed"

    finally:
        db.close()
