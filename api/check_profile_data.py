from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres.oxihvasgvldvusakfmsb:1997Nkosinathi@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')
with engine.connect() as conn:
    res = conn.execute(text(
        "SELECT slug, name, supporting_image_urls, services, whatsapp_number, short_bio, is_public "
        "FROM profiles WHERE slug IN ('antigravity-tech', 'global-it-and-business-solutions-pty-ltd')"
    ))
    for r in res:
        slug, name, siurls, svcs, wa, bio, pub = r
        print(f"slug={slug}")
        print(f"  name={name!r}")
        print(f"  supporting_image_urls={siurls!r}")
        print(f"  services={repr(str(svcs)[:120])}")
        print(f"  whatsapp_number={wa!r}")
        print(f"  short_bio={repr(str(bio)[:80])}")
        print(f"  is_public={pub!r}")
        print()
