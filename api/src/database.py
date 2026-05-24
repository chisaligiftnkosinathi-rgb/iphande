
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
    from src.models.financial_event import FinancialEvent  # noqa: F401
    from src.models.quote import Quote  # noqa: F401
    from src.models.invoice import Invoice  # noqa: F401
    from src.models.payment_intent import PaymentIntent  # noqa: F401

def create_tables():
    register_models()
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_replay_schema()


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
        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS
                ix_continuity_events_lineage_sequence
                ON continuity_events (lineage_sequence)
                """
            )
        )
