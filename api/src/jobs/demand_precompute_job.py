import time
from src.services.demand_engine import DemandEngine
from src.services.demand_cache import DemandCache
from src.services.signal_aggregator import build_signals_from_context

demand_engine = DemandEngine()
demand_cache = DemandCache(ttl_seconds=60)

def get_active_geo_cells():
    return ["cell_-25.75_28.2"] # Mock for testing

def get_all_archetypes():
    return ["electrician", "plumber", "mechanic_auto", "cleaner"]

def save_to_db_snapshot(result):
    pass # L3 Cold Storage sync

def run_precompute():
    print(f"[{time.strftime('%X')}] Running demand precompute job...")
    for geo_cell in get_active_geo_cells():
        # Extrapolate lat/lng from cell name for mock context builder
        parts = geo_cell.split("_")
        lat = float(parts[1]) if len(parts) > 1 else 0.0
        lng = float(parts[2]) if len(parts) > 2 else 0.0

        signals = build_signals_from_context(lat, lng)

        for archetype in get_all_archetypes():
            result = demand_engine.compute_demand_score(
                signals,
                archetype,
                geo_cell
            )
            
            demand_cache.set(geo_cell, archetype, result)
            save_to_db_snapshot(result)
            
    print(f"[{time.strftime('%X')}] Demand precompute completed.")
