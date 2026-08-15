from contextlib import asynccontextmanager
import logging
import asyncio

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from src.config import settings
from src.core.logging import setup_logging, RequestIdMiddleware
from src.core.exceptions import (
    global_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    http_exception_handler
)

# Initialize structured logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# ============================================================================
# FINANCIAL SYSTEM LIFECYCLE STATE
# ============================================================================
# Global state for 3-layer lifecycle: defines when system is safe to accept money
_app_state = {
    "ready": False,  # False until all financial safety systems initialized
    "boot_time": None,
}

from src.routes import (
    health_routes, profile_routes, opportunity_routes, timeline_routes, followup_routes,
    media_routes, reflection_routes, campaign_routes, message_template_routes, scripture_reflection_routes,
    content_post_routes, places_routes,
    business_categories, business_content_rules, quote_request_routes, giving_routes,
    steward_timeline_routes, steward_annotations, referral_routes, public_routes,
    advertisement_routes, expense_routes, share_routes, admin_routes, document_routes, steward_console_routes,
    public_profiles, feed_geo, geo_match, engagement_events, action_delivery, feedback,
    trust, demand, ws_actions, availability, routing, telemetry, telemetry_drift,
    telemetry_simulation, dashboard_routes, bootstrap_routes
)
from src.routers.handshake import router as handshake_router
from src.routers.financial_events import router as financial_events_router
from src.routers.quotes import router as quotes_router
from src.routers.invoices import router as invoices_router
from src.routers.payments import router as payments_router
from src.routers.reconciliation import router as reconciliation_router
from src.routers.inventory import router as inventory_router
from src.routers.commissions import router as commissions_router
from src.routes.continuity_capture_routes import router as continuity_capture_router
from src.routes.lead_routes import router as lead_router
from src.routes.river_routes import router as river_router
from src.routes.river_stream_routes import router as river_stream_router
from src.routes.payment_routes import router as payment_config_router
from src.routes.payfast_routes import router as payfast_router
from src.routes import auth_routes

from src.models.quote_request_model import QuoteRequest
from src.database import SessionLocal, engine, Base
from src.database_immutability import register_immutability_guards
from src.routes.continuity_event_routes import router as continuity_event_router


# Real-time WebSockets
from src.realtime.ws_gateway import redis_listener, manager
from src.services.demand_pubsub import demand_pubsub



# ============================================================================
# 3-LAYER LIFECYCLE: FINANCIAL SYSTEM INITIALIZATION
# ============================================================================

async def _init_background():
    """
    LAYER 2: BACKGROUND INITIALIZATION

    Runs after app boots. Initializes all financial safety systems:
    - Immutability guard registration (CRITICAL)
    - Database connection validation
    - Optional schema creation (only if AUTO_CREATE_SCHEMA=True)

    Does NOT block app startup. App is healthy even if this fails.
    """
    try:
        logger.info("⚙️  Background initialization started")

        # 6F.7.2: Schema creation removed. Alembic is the sole authority.
        # If the schema is missing, it's a deployment error, not something we repair at runtime.

        # CRITICAL: Register immutability guards for ledger protection
        logger.info("🔐 Registering immutability guards...")
        register_immutability_guards()
        logger.info("✅ Immutability guards ACTIVE (ledger writes now protected)")

        # Mark system as ready for financial operations
        _app_state["ready"] = True
        logger.info("✅ Financial system READY — payments can now be accepted")

    except Exception as e:
        logger.error(f"❌ CRITICAL: Background initialization failed: {e}", exc_info=True)
        _app_state["ready"] = False
        # Do NOT raise — allow app to continue (but in degraded state)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    3-LAYER LIFECYCLE MANAGER

    Defines when a financial system is safe to accept money.

    LAYER 1 (FAST BOOT): App starts immediately (<500ms target)
    - No DB writes
    - No schema creation
    - No immutability registration
    - Only routing + config

    LAYER 2 (BACKGROUND INIT): Critical systems initialized
    - Starts after app boots
    - Does NOT block /health or routing
    - Registers immutability guards (CRITICAL)
    - Validates DB connection

    LAYER 3 (READINESS GATE): Payment safety check
    - GET /api/v1/ready (new endpoint)
    - Payment routes MUST check readiness before executing
    """

    import datetime
    _app_state["boot_time"] = datetime.datetime.now(datetime.timezone.utc)

    logger.info(f"🚀 LAYER 1: App booting (fast path, non-blocking)")
    logger.info(f"   DEPLOYMENT_MODE={settings.DEPLOYMENT_MODE}")
    logger.info(f"   AUTO_CREATE_SCHEMA={settings.AUTO_CREATE_SCHEMA}")

    # Start background initialization task
    # Does NOT block app from responding to /health or routing
    bg_init_task = asyncio.create_task(_init_background())

    listener_task = None
    # import redis
    # try:
    #     pubsub = demand_pubsub.subscribe("demand.events")
    #     pubsub.subscribe("geo.events")
    #     pubsub.subscribe("match.events")
    #
    #     listener_task = asyncio.create_task(
    #         redis_listener(pubsub, manager)
    #     )
    # except redis.exceptions.RedisError:
    #     logger.warning("WARNING: Redis is not running or timed out. WebSockets and Pub/Sub will be disabled.")
    #     listener_task = None

    yield

    # Shutdown
    logger.info("🛑 App shutdown initiated")

    if bg_init_task:
        bg_init_task.cancel()

    if listener_task:
        listener_task.cancel()


from src.core.rate_limit import setup_rate_limiting

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    description="Visibility, opportunity continuity, replay, and grace reflection platform.",
    lifespan=lifespan,
)

setup_rate_limiting(app)

# Add Middleware
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

if settings.DEPLOYMENT_MODE == "pilot":
    # PILOT MODE: Core loop only
    app.include_router(health_routes.router)
    app.include_router(handshake_router)
    app.include_router(auth_routes.router)
    app.include_router(profile_routes.router, prefix="/api/v1")
    app.include_router(media_routes.router, prefix="/api/v1")
    app.include_router(dashboard_routes.router)
    app.include_router(bootstrap_routes.router, prefix="/api/v1")
    
    # Quotes Router for S2S
    from src.routers.quotes import router as quotes_router
    app.include_router(quotes_router)
    
    # S2S Router
    from src.routers.s2s import router as s2s_router
    app.include_router(s2s_router)
    
    # 6F.6 Commercial Lifecycle Routes
    app.include_router(opportunity_routes.router, prefix="/api/v1")
    app.include_router(financial_events_router)
    app.include_router(payments_router)
    
else:
    # DEV / RC / PROD MODE: Full surface
    app.include_router(health_routes.router)
    app.include_router(dashboard_routes.router)
    app.include_router(bootstrap_routes.router, prefix="/api/v1")
    app.include_router(handshake_router)
    app.include_router(financial_events_router)
    app.include_router(quotes_router)
    app.include_router(invoices_router)
    app.include_router(payments_router)
    app.include_router(reconciliation_router)
    app.include_router(payment_config_router)
    app.include_router(payfast_router)
    app.include_router(inventory_router)
    app.include_router(commissions_router)
    app.include_router(demand.router, prefix="/api/v1")
    app.include_router(trust.router, prefix="/api/v1")
    app.include_router(availability.router, prefix="/api/v1")
    app.include_router(routing.router, prefix="/api/v1")
    app.include_router(telemetry.router, prefix="/api/v1")
    app.include_router(telemetry_drift.router, prefix="/api/v1")
    app.include_router(telemetry_simulation.router, prefix="/api/v1")
    app.include_router(feedback.router, prefix="/api/v1")
    app.include_router(ws_actions.router, prefix="/api/v1")
    app.include_router(action_delivery.router, prefix="/api/v1")
    app.include_router(engagement_events.router, prefix="/api/v1")
    app.include_router(geo_match.router, prefix="/api/v1")
    app.include_router(feed_geo.router, prefix="/api/v1")
    app.include_router(public_profiles.router, prefix="/api/v1")
    app.include_router(auth_routes.router)
    app.include_router(public_routes.router, prefix="/api/v1")
    app.include_router(profile_routes.router, prefix="/api/v1")
    app.include_router(opportunity_routes.router, prefix="/api/v1")
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

    # S2S Router
    from src.routers.s2s import router as s2s_router
    app.include_router(s2s_router)


# Canonical policy schema is not currently a runtime dependency of iPhande.
# Keep the endpoint available while the canonical policy package is integrated
# into the production deployment artifact.
@app.get("/api/v1/policies", response_model=list, tags=["Constitution"])
def list_policies():
    """Returns the current policies evaluating institutional rules."""
    return []
