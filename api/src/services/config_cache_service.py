"""
Platform Config Cache Layer

In-memory caching for platform configuration to avoid repeated database
queries during payment processing. Critical for payment latency optimization.

Caching Strategy:
- TTL: 5 minutes (balance between freshness and performance)
- Scope: All config lookups (platform fee %, account names, etc.)
- Invalidation: Automatic on TTL expiry + manual invalidation API
- Fallback: Database query on cache miss
"""

import time
from decimal import Decimal
from typing import Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session

from src.models.platform_config import PlatformConfig


class ConfigCacheEntry:
    """Represents a cached config value with timestamp."""

    def __init__(self, value: Any, ttl_seconds: int = 300):
        self.value = value
        self.timestamp = time.time()
        self.ttl_seconds = ttl_seconds

    def is_expired(self) -> bool:
        """Check if cache entry has expired."""
        return (time.time() - self.timestamp) > self.ttl_seconds

    def time_remaining(self) -> float:
        """Return seconds until expiry, or 0 if expired."""
        remaining = self.ttl_seconds - (time.time() - self.timestamp)
        return max(0, remaining)


class PlatformConfigCache:
    """
    In-memory cache for platform configuration.

    Reduces database hits for frequently-accessed config values like:
    - Platform fee percentages (per scope: global, trust tier, category, campaign)
    - Account names
    - Feature flags

    Thread-safe (Python GIL provides basic safety for dict operations).
    """

    # Global cache dictionary
    _cache: Dict[str, ConfigCacheEntry] = {}

    # Default TTL: 5 minutes
    _default_ttl_seconds = 300

    # Lock for cache operations (for thread safety)
    _lock = None

    @classmethod
    def _ensure_lock(cls):
        """Initialize threading lock on first use."""
        if cls._lock is None:
            import threading
            cls._lock = threading.RLock()

    @classmethod
    def get(
        cls,
        db: Session,
        key: str,
        scope: str = "global_default",
        default_value: Any = None,
    ) -> Any:
        """
        Get a config value from cache or database.

        Flow:
        1. Check cache - if fresh, return cached value
        2. If expired/missing - query database
        3. Cache the result
        4. Return value

        Args:
            db: Database session
            key: Config key (e.g., "platform_fee_percent")
            scope: Scope level (global_default, trust_tier, business_category, promotional)
            default_value: Value to return if config not found anywhere

        Returns:
            Config value from cache or database, or default_value if not found
        """
        cls._ensure_lock()

        # Build cache key
        cache_key = f"{key}:{scope}"

        with cls._lock:
            # Check if in cache and not expired
            if cache_key in cls._cache:
                entry = cls._cache[cache_key]
                if not entry.is_expired():
                    return entry.value

        # Cache miss or expired - query database
        config = db.query(PlatformConfig).filter(
            PlatformConfig.key == key,
            PlatformConfig.scope == scope,
            PlatformConfig.is_active == True,
        ).first()

        if config:
            value = cls._extract_value(config)
        else:
            value = default_value

        # Cache the result
        with cls._lock:
            cls._cache[cache_key] = ConfigCacheEntry(value, cls._default_ttl_seconds)

        return value

    @classmethod
    def get_fee_percent(
        cls,
        db: Session,
        trust_tier: Optional[str] = None,
        business_category: Optional[str] = None,
        campaign_id: Optional[str] = None,
    ) -> Decimal:
        """
        Get platform fee percent with priority hierarchy.

        Priority (highest to lowest):
        1. Promotional (campaign-specific)
        2. Business category
        3. Trust tier
        4. Global default

        Args:
            db: Database session
            trust_tier: Provider's trust tier (for tier-based pricing)
            business_category: Opportunity's business category (for category-based pricing)
            campaign_id: Active campaign ID (for promotional pricing)

        Returns:
            Platform fee percentage as Decimal
        """
        cls._ensure_lock()

        # Try each priority level in order
        if campaign_id:
            value = cls.get(db, "platform_fee_percent", f"promotional:{campaign_id}", None)
            if value is not None:
                return Decimal(str(value))

        if business_category:
            value = cls.get(db, "platform_fee_percent", f"business_category:{business_category}", None)
            if value is not None:
                return Decimal(str(value))

        if trust_tier:
            value = cls.get(db, "platform_fee_percent", f"trust_tier:{trust_tier}", None)
            if value is not None:
                return Decimal(str(value))

        # Default
        value = cls.get(db, "platform_fee_percent", "global_default", Decimal("10"))
        return Decimal(str(value))

    @classmethod
    def get_platform_account_name(cls, db: Session) -> str:
        """
        Get platform account name (usually "GLOBAL_IT_BUSINESS_SOLUTIONS").

        Cached to avoid repeated lookups during payment processing.
        """
        return cls.get(
            db,
            "platform_account_name",
            "global_default",
            "GLOBAL_IT_BUSINESS_SOLUTIONS"
        )

    @classmethod
    def invalidate(cls, key: str, scope: str = "global_default") -> None:
        """
        Manually invalidate a cache entry.

        Use when config is updated via API to ensure fresh data on next query.

        Args:
            key: Config key to invalidate
            scope: Scope level to invalidate
        """
        cls._ensure_lock()

        cache_key = f"{key}:{scope}"
        with cls._lock:
            if cache_key in cls._cache:
                del cls._cache[cache_key]

    @classmethod
    def invalidate_all(cls) -> None:
        """
        Clear entire cache.

        Use when multiple configs are updated or for testing.
        """
        cls._ensure_lock()

        with cls._lock:
            cls._cache.clear()

    @classmethod
    def get_stats(cls) -> Dict[str, Any]:
        """
        Get cache statistics for monitoring.

        Returns:
            {
                "total_entries": int,
                "expired_entries": int,
                "keys": [list of cache keys with TTL remaining]
            }
        """
        cls._ensure_lock()

        with cls._lock:
            expired_count = sum(
                1 for entry in cls._cache.values() if entry.is_expired()
            )

            keys_with_ttl = [
                {"key": k, "ttl_remaining": v.time_remaining()}
                for k, v in cls._cache.items()
            ]

            return {
                "total_entries": len(cls._cache),
                "expired_entries": expired_count,
                "keys": keys_with_ttl,
            }

    @staticmethod
    def _extract_value(config: PlatformConfig) -> Any:
        """Extract value from PlatformConfig based on value_type."""
        if config.value_type == "decimal":
            return config.decimal_value
        elif config.value_type == "string":
            return config.string_value
        elif config.value_type == "boolean":
            return config.boolean_value
        else:
            return config.decimal_value or config.string_value or config.boolean_value


# ===== INTEGRATION WITH LEDGER SAFETY SERVICE =====
# The LedgerSafetyService.get_platform_fee_percent() should use this cache:
#
# Original (from ledger_safety_service.py):
#   def get_platform_fee_percent(db, trust_tier, business_category, campaign_id):
#       query PlatformConfig with priority hierarchy
#       return decimal
#
# Updated (with cache):
#   def get_platform_fee_percent(db, trust_tier, business_category, campaign_id):
#       return PlatformConfigCache.get_fee_percent(
#           db, trust_tier, business_category, campaign_id
#       )
