
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager
from src.config import DATA_DIR, DATABASE_URL

DATA_DIR.mkdir(exist_ok=True)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def replay_transaction(db):
    """
    Constitutional transaction boundary for iPhande.
    Ensures state mutation and replay lineage are committed as one atomic unit.
    """
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise

# Model registration to ensure all models are attached to Base before table creation

def register_models():
    from src.models.continuity_capture import ContinuityCapture  # noqa: F401
    from src.models.quote_request_model import QuoteRequest  # noqa: F401
    from src.models.giving_model import Giving  # noqa: F401
    from src.models.continuity_event_model import ContinuityEvent  # noqa: F401
    from src.models.profile import Profile  # noqa: F401
    from src.models.opportunity import Opportunity  # noqa: F401
    from src.models.timeline_event import TimelineEvent  # noqa: F401
    from src.models.followup import FollowUp  # noqa: F401
    from src.models.media import Media  # noqa: F401
    from src.models.reflection import Reflection  # noqa: F401
    from src.models.campaign import Campaign  # noqa: F401
    from src.models.message_template import MessageTemplate  # noqa: F401
    from src.models.scripture_reflection import ScriptureReflection  # noqa: F401
    from src.models.content_post import ContentPost  # noqa: F401
    from src.models.advertisement import Advertisement  # noqa: F401
    from src.models.financial_event import FinancialEvent  # noqa: F401
    from src.models.quote import Quote  # noqa: F401
    from src.models.invoice import Invoice  # noqa: F401
    from src.models.payment_intent import PaymentIntent, ProofOfPayment  # noqa: F401
    from src.models.inventory import InventoryItem, InventoryMovement  # noqa: F401
    from src.models.steward_annotation import StewardAnnotation  # noqa: F401
    from src.models.expense import Expense  # noqa: F401
    from src.models.referral import Referral  # noqa: F401
    from src.models.place import Place  # noqa: F401

def create_tables():
    register_models()
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_replay_schema()
    ensure_sqlite_content_posts_schema()
    ensure_sqlite_quotes_schema()
    ensure_sqlite_quotes_v2_schema()
    ensure_sqlite_payment_evidence_schema()
    ensure_sqlite_profiles_schema()
    ensure_postgres_profiles_schema()
    ensure_postgres_leads_schema()
    ensure_postgres_quotes_schema()
    ensure_postgres_quotes_v2_schema()
    ensure_postgres_opportunities_schema()
    ensure_postgres_advertisements_schema()


def ensure_sqlite_content_posts_schema():
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "content_posts" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("content_posts")}
    with engine.begin() as connection:
        if "template_key" not in columns:
            connection.execute(text("ALTER TABLE content_posts ADD COLUMN template_key VARCHAR"))


def ensure_sqlite_quotes_schema():
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "quotes" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quotes")}
    with engine.begin() as connection:
        if "business_owner_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN business_owner_id VARCHAR"))
        if "customer_request_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN customer_request_id VARCHAR"))
        if "customer_name" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN customer_name VARCHAR"))
        if "customer_phone" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN customer_phone VARCHAR"))
        if "description" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN description TEXT"))
        if "amount" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN amount NUMERIC(12,2)"))
        if "currency" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN currency VARCHAR DEFAULT 'ZAR'"))
        if "terms" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN terms VARCHAR"))
        if "status" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN status VARCHAR DEFAULT 'issued'"))
        if "continuity_event_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN continuity_event_id CHAR(32)"))
        if "sent_continuity_event_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN sent_continuity_event_id CHAR(32)"))
        if "accepted_continuity_event_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN accepted_continuity_event_id CHAR(32)"))
        if "sent_at" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN sent_at DATETIME"))
        if "accepted_at" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN accepted_at DATETIME"))

        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_quotes_business_owner_id ON quotes(business_owner_id)"))


def ensure_sqlite_quotes_v2_schema():
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "quotes" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quotes")}
    with engine.begin() as connection:
        if "subtotal" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN subtotal NUMERIC(12,2)"))
        if "vat" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN vat NUMERIC(12,2)"))
        if "line_items" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN line_items JSON"))
        if "structured_terms" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN structured_terms JSON"))
        if "archetype_key" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN archetype_key VARCHAR"))
        if "business_line" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN business_line VARCHAR"))
        if "quote_template_version" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN quote_template_version VARCHAR NOT NULL DEFAULT 'QUOTE_V1'"))

def ensure_sqlite_payment_evidence_schema():
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "payment_intents" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("payment_intents")}
    with engine.begin() as connection:
        if "receipt_number" not in columns:
            connection.execute(text("ALTER TABLE payment_intents ADD COLUMN receipt_number VARCHAR"))
        if "receipt_continuity_event_id" not in columns:
            connection.execute(text("ALTER TABLE payment_intents ADD COLUMN receipt_continuity_event_id CHAR(32)"))


def ensure_sqlite_profiles_schema():
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "profiles" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("profiles")}
    with engine.begin() as connection:
        if "owner_id" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN owner_id VARCHAR"))
        if "onboarding_completed" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT 0"))
        if "referral_code" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN referral_code VARCHAR"))
            connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_profiles_referral_code ON profiles(referral_code)"))
        if "referred_by_code" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN referred_by_code VARCHAR"))
        if "is_verified" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 0"))
        if "activated_at" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN activated_at DATETIME"))
        if "company_logo_url" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN company_logo_url VARCHAR"))


def ensure_sqlite_replay_schema():
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "continuity_events" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("continuity_events")}
    with engine.begin() as connection:
        if "lineage_sequence" not in columns:
            connection.execute(text("ALTER TABLE continuity_events ADD COLUMN lineage_sequence BIGINT"))
        connection.execute(
            text(
                """
                UPDATE continuity_events
                SET lineage_sequence = rowid
                WHERE lineage_sequence IS NULL
                """
            )
        )


def ensure_postgres_leads_schema():
    if not DATABASE_URL or not DATABASE_URL.startswith("postgres"):
        return

    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS leads (
                id VARCHAR PRIMARY KEY,
                owner_id VARCHAR NOT NULL,
                profile_slug VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                phone VARCHAR NOT NULL,
                message TEXT,
                service_needed VARCHAR,
                status VARCHAR NOT NULL DEFAULT 'new',
                source VARCHAR NOT NULL DEFAULT 'public_profile',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_leads_owner_id
            ON leads(owner_id)
        """))

def ensure_postgres_profiles_schema():
    if engine.dialect.name != "postgresql":
        return

    inspector = inspect(engine)
    if "profiles" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("profiles")}

    with engine.begin() as connection:
        if "is_public" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE"))
        if "province" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN province VARCHAR"))
        if "city" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN city VARCHAR"))
        if "suburb" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN suburb VARCHAR"))
        if "whatsapp_number" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN whatsapp_number VARCHAR"))
        if "facebook_page_url" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN facebook_page_url VARCHAR"))
        if "cover_photo_url" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN cover_photo_url VARCHAR"))
        if "logo_url" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN logo_url VARCHAR"))
        if "supporting_image_urls" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN supporting_image_urls VARCHAR"))
        if "onboarding_completed" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE"))
        if "referral_code" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN referral_code VARCHAR"))
            connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_profiles_referral_code ON profiles(referral_code)"))
        if "referred_by_code" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN referred_by_code VARCHAR"))
        if "owner_id" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN owner_id VARCHAR"))
        if "proof_of_work_items" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN proof_of_work_items TEXT"))
        if "is_verified" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE"))
        if "activated_at" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN activated_at TIMESTAMP"))
        if "company_logo_url" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN company_logo_url VARCHAR"))
        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS
                ix_continuity_events_lineage_sequence
                ON continuity_events (lineage_sequence)
                """
            )
        )

def ensure_postgres_opportunities_schema():
    if engine.dialect.name != "postgresql":
        return

    inspector = inspect(engine)
    if "opportunities" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("opportunities")}
    with engine.begin() as connection:
        if "created_by_profile_id" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN created_by_profile_id VARCHAR"))
        if "town_or_city" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN town_or_city VARCHAR"))
        if "suburb_or_area" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN suburb_or_area VARCHAR"))
        if "category_key" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN category_key VARCHAR"))
        if "service_needed" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN service_needed VARCHAR"))
        if "budget_amount" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN budget_amount VARCHAR"))
        if "contact_name" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN contact_name VARCHAR"))
        if "contact_phone" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN contact_phone VARCHAR"))
        if "image_url_1" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN image_url_1 VARCHAR"))
        if "image_url_2" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN image_url_2 VARCHAR"))
        if "expiry_date" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN expiry_date TIMESTAMP"))
        if "latitude" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN latitude FLOAT"))
        if "longitude" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN longitude FLOAT"))
        if "place_code" not in columns:
            connection.execute(text("ALTER TABLE opportunities ADD COLUMN place_code VARCHAR"))

def ensure_postgres_quotes_schema():
    if engine.dialect.name != "postgresql":
        return

    inspector = inspect(engine)
    if "quotes" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quotes")}
    with engine.begin() as connection:
        if "business_owner_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN business_owner_id VARCHAR"))
        if "customer_request_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN customer_request_id VARCHAR"))
        if "customer_name" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN customer_name VARCHAR"))
        if "customer_phone" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN customer_phone VARCHAR"))
        if "description" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN description TEXT"))
        if "amount" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN amount NUMERIC(12,2)"))
        if "currency" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN currency VARCHAR DEFAULT 'ZAR'"))
        if "terms" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN terms VARCHAR"))
        if "status" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN status VARCHAR DEFAULT 'issued'"))
        if "continuity_event_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN continuity_event_id UUID"))
        if "sent_continuity_event_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN sent_continuity_event_id UUID"))
        if "accepted_continuity_event_id" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN accepted_continuity_event_id UUID"))
        if "sent_at" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN sent_at TIMESTAMP"))
        if "accepted_at" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN accepted_at TIMESTAMP"))

        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_quotes_business_owner_id ON quotes(business_owner_id)"))


def ensure_postgres_quotes_v2_schema():
    if engine.dialect.name != "postgresql":
        return

    inspector = inspect(engine)
    if "quotes" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("quotes")}
    with engine.begin() as connection:
        if "subtotal" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN subtotal NUMERIC(12,2)"))
        if "vat" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN vat NUMERIC(12,2)"))
        if "line_items" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN line_items JSON"))
        if "structured_terms" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN structured_terms JSON"))
        if "archetype_key" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN archetype_key VARCHAR"))
        if "business_line" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN business_line VARCHAR"))
        if "quote_template_version" not in columns:
            connection.execute(text("ALTER TABLE quotes ADD COLUMN quote_template_version VARCHAR NOT NULL DEFAULT 'QUOTE_V1'"))

def ensure_postgres_advertisements_schema():
    if engine.dialect.name != "postgresql":
        return

    inspector = inspect(engine)
    if "advertisements" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("advertisements")}
    with engine.begin() as connection:
        if "image_url" not in columns:
            connection.execute(text("ALTER TABLE advertisements ADD COLUMN image_url VARCHAR"))
