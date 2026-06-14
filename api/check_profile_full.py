from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres.oxihvasgvldvusakfmsb:1997Nkosinathi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

with engine.connect() as conn:
    res = conn.execute(text(
        "SELECT id, slug, name, location_is_public, created_at, short_bio, services, "
        "supporting_image_urls, provider_type, location, business_category_key, business_line, "
        "contact_method, logo_url, cover_photo_url, phone, operating_area, address_label, "
        "service_radius_km, service_area_notes "
        "FROM profiles WHERE slug = 'antigravity-tech'"
    ))
    cols = res.keys()
    for row in res:
        for k, v in zip(cols, row):
            print(f"  {k}: {repr(v)}")
