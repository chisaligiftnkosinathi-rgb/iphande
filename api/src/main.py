
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import API_VERSION, APP_NAME, CORS_ORIGINS
from src.routes import (
    health_routes, profile_routes, opportunity_routes, timeline_routes, followup_routes,
    media_routes, reflection_routes, campaign_routes, message_template_routes, scripture_reflection_routes, content_post_routes,
    business_categories, business_content_rules, quote_request_routes, giving_routes
)
from src.routers.handshake import router as handshake_router
from src.routers.financial_events import router as financial_events_router
from src.routers.quotes import router as quotes_router
from src.routers.invoices import router as invoices_router
from src.routers.payments import router as payments_router
from src.routers.inventory import router as inventory_router

from src.models.quote_request_model import QuoteRequest
from src.database import create_tables
from src.routes.continuity_event_routes import router as continuity_event_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        create_tables()
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
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
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
app.include_router(profile_routes.router, prefix="/api/v1")
app.include_router(opportunity_routes.router, prefix="/api/v1")
app.include_router(timeline_routes.router, prefix="/api/v1")
app.include_router(followup_routes.router, prefix="/api/v1")

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
app.include_router(continuity_event_router, prefix="/api/v1/continuity-events", tags=["continuity-events"])

# Clean 404 handler
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found"})
