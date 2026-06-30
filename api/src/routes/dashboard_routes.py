"""
Dashboard Routes

Backend-for-Frontend (BFF) layer for steward dashboard.

Exposes a single canonical endpoint that aggregates merchant, trust, wallet,
and operational data into a mobile-optimized response.

This route handler is deliberately thin—all aggregation logic lives in
DashboardService so it can be reused across different UIs (web, admin, etc.).
"""

import logging
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.core.security import get_current_user
from src.database import get_db
from src.services.dashboard_service import DashboardService
from src.schemas.dashboard_schema import DashboardResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> DashboardResponse:
    """
    Get complete steward dashboard snapshot.

    Aggregates merchant, trust, wallet, opportunities, notifications, and platform
    information into a single response optimized for the mobile dashboard screen.

    **Response Contract:**

    - `schema_version`: Bump when response structure changes (enables client migrations)
    - `timestamp`: UTC time when snapshot was generated
    - `generated_in_ms`: Backend latency for performance monitoring
    - Each section is wrapped in a `DashboardSection` envelope with `status`, `data`, `error`

    **Graceful Degradation:**

    If merchant service fails, trust/wallet/notifications still load.
    If notifications fail, merchant/trust/wallet still load.
    This allows partial renders on the mobile app.

    **Performance:**

    Target: < 500ms total latency
    - Merchant fetch: ~50ms
    - Trust recalculation: ~150ms
    - Wallet aggregation: ~50ms
    - Opportunities: ~30ms
    - Notifications: ~30ms
    - Platform: ~10ms

    **Caching Opportunity:**

    Merchant and trust could be cached for 5 minutes if recalculation is expensive.
    See phase 2 optimization if response time exceeds targets.

    Args:
        db: Database session
        current_user: Authenticated user dict (from JWT token)

    Returns:
        DashboardResponse with all sections

    Raises:
        HTTPException 401: If not authenticated
        HTTPException 500: Should not happen—service returns partial data instead
    """
    try:
        # Start timing
        start_time = time.time()

        user_id = current_user["uid"]

        # Build dashboard via service layer
        response = DashboardService.build_dashboard(db, user_id)

        # Measure latency
        elapsed_ms = (time.time() - start_time) * 1000
        response.generated_in_ms = elapsed_ms

        logger.info(
            f"Dashboard generated for user {user_id} in {elapsed_ms:.1f}ms"
        )

        return response

    except Exception as e:
        logger.exception(f"Dashboard generation failed for user {current_user.id}")
        raise HTTPException(
            status_code=500,
            detail=f"Dashboard generation failed: {str(e)}"
        )
