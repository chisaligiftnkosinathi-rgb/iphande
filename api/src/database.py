
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager
from src.config import DATA_DIR, settings

DATA_DIR.mkdir(exist_ok=True)

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
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
    from src.models.continuity_event_model import ContinuityEvent  # noqa: F401
    from src.models.profile import Profile  # noqa: F401
    from src.models.opportunity import Opportunity  # noqa: F401
    from src.models.timeline_event import TimelineEvent  # noqa: F401
    from src.models.followup import FollowUp  # noqa: F401
    from src.models.media import Media  # noqa: F401
    from src.models.campaign import Campaign  # noqa: F401
    from src.models.message_template import MessageTemplate  # noqa: F401
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
    from src.models.tenant_mapping import TenantIdentityMapping  # noqa: F401
    from src.models.order import Order  # noqa: F401
    from src.models.lead_offer import AffiliateOffer, AffiliateLead  # noqa: F401

