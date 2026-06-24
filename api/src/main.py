from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from src.config import API_VERSION, APP_NAME, CORS_ORIGINS
from src.routes import (
    health_routes, profile_routes, opportunity_routes, timeline_routes, followup_routes,
    media_routes, reflection_routes, campaign_routes, message_template_routes, scripture_reflection_routes,
    content_post_routes, places_routes,
    business_categories, business_content_rules, quote_request_routes, giving_routes,
    steward_timeline_routes, steward_annotations, referral_routes, public_routes,
    advertisement_routes, expense_routes, share_routes, admin_routes, document_routes, steward_console_routes,
    public_profiles, feed_geo, geo_match, engagement_events, action_delivery, feedback,
    trust, demand, ws_actions, availability, routing
)
from src.routers.handshake import router as handshake_router
from src.routers.financial_events import router as financial_events_router
from src.routers.quotes import router as quotes_router
from src.routers.invoices import router as invoices_router
from src.routers.payments import router as payments_router
from src.routers.inventory import router as inventory_router
from src.routers.commissions import router as commissions_router
from src.routes.continuity_capture_routes import router as continuity_capture_router
from src.routes.lead_routes import router as lead_router
from src.routes.river_routes import router as river_router
from src.routes.river_stream_routes import router as river_stream_router

from src.models.quote_request_model import QuoteRequest
from src.database import create_tables, SessionLocal, engine, Base
from src.routes.continuity_event_routes import router as continuity_event_router

logger = logging.getLogger(__name__)


# Real-time WebSockets
from src.realtime.ws_gateway import redis_listener, manager
from src.services.demand_pubsub import demand_pubsub


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")
    
    # Start Redis Listener for WebSockets
    pubsub = demand_pubsub.subscribe("demand.events")
    pubsub.subscribe("geo.events")
    pubsub.subscribe("match.events")
    
    listener_task = asyncio.create_task(
        redis_listener(pubsub, manager)
    )

    try:
        # Patch existing leads table with the missing 'source' column
        try:
            db = SessionLocal()
            db.execute(text("ALTER TABLE leads ADD COLUMN source VARCHAR NOT NULL DEFAULT 'public_profile';"))
            db.commit()
            db.close()
        except Exception:
            pass

        # Patch existing quotes table with the missing 'share_token' column
        try:
            db = SessionLocal()
            db.execute(text("ALTER TABLE quotes ADD COLUMN share_token VARCHAR;"))
            db.commit()
            # Populate existing quotes with a share_token if they don't have one
            from src.models.quote import Quote
            import uuid
            quotes_to_update = db.query(Quote).filter(Quote.share_token == None).all()
            for q in quotes_to_update:
                q.share_token = str(uuid.uuid4())
            db.commit()
            db.close()
        except Exception:
            pass
    except Exception:
        logger.exception(
            "Database table initialization failed during startup; "
            "continuing so /health can report application liveness."
        )
    yield


app = FastAPI(
    title=APP_NAME,
    version=API_VERSION,
    description="Visibility, opportunity continuity, replay, and grace reflection platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
            "http://127.0.0.1:19006",
        "https://iphande-production.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_routes.router)
app.include_router(handshake_router)
app.include_router(financial_events_router)
app.include_router(quotes_router)
app.include_router(invoices_router)
app.include_router(payments_router)
app.include_router(inventory_router)
app.include_router(commissions_router)
app.include_router(demand.router, prefix="/api/v1")
app.include_router(trust.router, prefix="/api/v1")
app.include_router(availability.router, prefix="/api/v1")
app.include_router(routing.router, prefix="/api/v1")
app.include_router(feedback.router, prefix="/api/v1")
app.include_router(ws_actions.router, prefix="/api/v1")
app.include_router(action_delivery.router, prefix="/api/v1")
app.include_router(engagement_events.router, prefix="/api/v1")
app.include_router(geo_match.router, prefix="/api/v1")
app.include_router(feed_geo.router, prefix="/api/v1")
app.include_router(public_profiles.router, prefix="/api/v1")
app.include_router(public_routes.router, prefix="/api/v1")
app.include_router(profile_routes.router, prefix="/api/v1")
app.include_router(opportunity_routes.router, prefix="/api/v1")
app.include_router(health_routes.router, prefix="/api/v1")
app.include_router(referral_routes.router, prefix="/api/v1")
app.include_router(advertisement_routes.router, prefix="/api/v1")
app.include_router(timeline_routes.router, prefix="/api/v1")
app.include_router(followup_routes.router, prefix="/api/v1")
app.include_router(lead_router, prefix="/api/v1", tags=["leads"])
app.include_router(admin_routes.router)
app.include_router(admin_routes.admin_router)

app.include_router(business_categories.router)
app.include_router(business_content_rules.router)
app.include_router(media_routes.router, prefix="/api/v1")
app.include_router(quote_request_routes.router)
app.include_router(giving_routes.router)
app.include_router(reflection_routes.router, prefix="/api/v1")
app.include_router(campaign_routes.router, prefix="/api/v1")
app.include_router(message_template_routes.router, prefix="/api/v1")
app.include_router(scripture_reflection_routes.router, prefix="/api/v1")
app.include_router(content_post_routes.router, prefix="/api/v1")
app.include_router(steward_timeline_routes.router)
app.include_router(steward_annotations.router, prefix="/api/v1", tags=["steward-annotations"])
app.include_router(expense_routes.router)
app.include_router(share_routes.router)
app.include_router(document_routes.router)
app.include_router(continuity_event_router, prefix="/api/v1/continuity-events", tags=["continuity-events"])
app.include_router(places_routes.router)
app.include_router(continuity_capture_router, prefix="/api/v1/continuity-captures", tags=["continuity-captures"])
app.include_router(steward_console_routes.router)
app.include_router(river_router, prefix="/api/v1")
app.include_router(river_stream_router, prefix="/api/v1")

# Clean 404 handler
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})
