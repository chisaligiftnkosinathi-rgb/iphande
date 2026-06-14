"""Test the updated PublicProfileOut schema against the antigravity-tech DB row."""
import sys
sys.path.insert(0, '.')

from src.schemas.public_profile_schema import PublicProfileOut

class FakeAntigravityProfile:
    id = '2bd201d9-a762-4373-89c5-6fe304bf4e40'
    slug = 'antigravity-tech'
    name = 'Antigravity Tech'
    location_is_public = True
    created_at = None           # This was causing the 500
    short_bio = None
    services = None
    supporting_image_urls = None
    provider_type = 'Digital Steward / Systems Builder'
    location = None
    business_category_key = 'tech_digital_services'
    business_line = 'Website Development'
    contact_method = None
    logo_url = None
    cover_photo_url = None
    phone = None
    operating_area = None
    address_label = None
    service_radius_km = None
    service_area_notes = None

class FakeGlobalITProfile:
    id = 'some-id'
    slug = 'global-it-and-business-solutions-pty-ltd'
    name = 'Global IT and Business Solutions (Pty) Ltd'
    location_is_public = True
    created_at = None
    short_bio = 'Global IT and Business Solutions (Pty) Ltd helps communities, small businesses'
    services = 'App Development, Website Design, IT Support'
    supporting_image_urls = '""'  # double-quoted empty string from DB
    provider_type = None
    location = None
    business_category_key = None
    business_line = None
    contact_method = None
    logo_url = None
    cover_photo_url = None
    phone = None
    operating_area = None
    address_label = None
    service_radius_km = None
    service_area_notes = None

try:
    result1 = PublicProfileOut.model_validate(FakeAntigravityProfile())
    print("✅ antigravity-tech schema validation PASSED")
    print(f"   services: {result1.services!r}")
    print(f"   short_bio: {result1.short_bio!r}")
    print(f"   created_at: {result1.created_at!r}")
    print(f"   supporting_image_urls: {result1.supporting_image_urls!r}")
except Exception as e:
    print(f"❌ antigravity-tech FAILED: {e}")

print()

try:
    result2 = PublicProfileOut.model_validate(FakeGlobalITProfile())
    print("✅ global-it schema validation PASSED")
    print(f"   services: {result2.services!r}")
    print(f"   short_bio: {result2.short_bio!r}")
    print(f"   supporting_image_urls: {result2.supporting_image_urls!r}")
except Exception as e:
    print(f"❌ global-it FAILED: {e}")
