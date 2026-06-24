from fastapi import APIRouter
from src.services.demand_engine import DemandEngine
from src.services.signal_aggregator import build_signals_from_context

router = APIRouter(prefix="/demand", tags=["Demand Prediction Engine"])
demand_engine = DemandEngine()

def get_all_archetypes():
    return ["electrician", "plumber", "mechanic_auto", "cleaner"]

def get_geo_cells(lat: float, lng: float):
    # Dummy mock for now
    return [f"cell_{round(lat, 2)}_{round(lng, 2)}"]

@router.get("/feed")
def get_demand_feed(lat: float, lng: float):
    signals = build_signals_from_context(lat, lng)

    matrix = demand_engine.build_demand_matrix(
        signals,
        archetypes=get_all_archetypes(),
        geo_cells=get_geo_cells(lat, lng)
    )

    # Convert dataclasses to dicts for JSON
    results = [
        {
            "archetype": m.archetype,
            "geo_cell": m.geo_cell,
            "time_window": m.time_window,
            "demand_score": m.demand_score,
            "trend": m.trend,
            "components": m.components
        } for m in matrix
    ]
    return sorted(results, key=lambda x: x["demand_score"], reverse=True)

@router.get("/preview")
def get_heatmap(lat: float = 0.0, lng: float = 0.0):
    # Safe exposure endpoint
    return get_demand_feed(lat, lng)
