from src.services.availability_engine import availability_engine
from src.services.demand_engine import DemandEngine
from src.services.smart_router import smart_router
from src.services.signal_aggregator import build_signals_from_context

class OpportunityAllocator:

    def allocate(self, opportunity, matches: list):
        if not matches:
            return {
                "opportunity_id": str(opportunity.id),
                "assigned_profile_id": None,
                "confidence": 0.0,
                "status": "queued",
                "reason": ["no_candidates"],
                "fallback_candidates": []
            }

        scored = []
        demand_engine = DemandEngine()
        signals = build_signals_from_context(getattr(opportunity, 'latitude', 0.0), getattr(opportunity, 'longitude', 0.0))
        mock_geo_cell = f"cell_{round(getattr(opportunity, 'latitude', 0.0), 2)}_{round(getattr(opportunity, 'longitude', 0.0), 2)}"

        for match in matches:
            profile_id = match["profile_id"]
            
            # ELB Integration: Check if healthy enough to receive work
            from src.services.economic_load_balancer import economic_load_balancer
            load_state = economic_load_balancer.compute(profile_id)
            
            if load_state["status"] == "overloaded":
                continue # Hard skip, do not allocate
            
            # 1. GeoMatch Score (40%)
            geo_match_score = match.get("match_score", 0.0) # Assume 0.0-1.0 range internally or normalized

            # 2. Availability Score (25%)
            availability = availability_engine.compute(profile_id)
            avail_score = availability.get("score", 0.0)

            # 3. Trust Score (20%)
            trust_score = 0.8 # Stub for v1

            # 4. Demand Fit (10%)
            demand = demand_engine.compute_demand_score(signals, match.get("archetype", "general"), mock_geo_cell)
            demand_score = demand.get("demand_score", 0.0)

            # 5. Routing Confidence (5%)
            routing = smart_router.route({"priority": getattr(opportunity, 'urgency_score', 0.5)}, profile_id)
            routing_score = routing.get("confidence", 0.0)

            # Calculate allocation total score
            score = (
                geo_match_score * 0.40 +
                avail_score * 0.25 +
                trust_score * 0.20 +
                demand_score * 0.10 +
                routing_score * 0.05
            )

            # ELB Penalty: Reduce score heavily if stressed
            if load_state["status"] == "stressed":
                score = score * 0.6

            scored.append((profile_id, score))

        if not scored:
            return {
                "opportunity_id": str(opportunity.id),
                "assigned_profile_id": None,
                "confidence": 0.0,
                "status": "queued",
                "reason": ["all_candidates_overloaded_or_empty"],
                "fallback_candidates": []
            }

        # Sort highest first
        scored.sort(key=lambda x: x[1], reverse=True)

        best_profile, best_score = scored[0]
        
        fallback_candidates = [{"profile_id": p, "score": s} for p, s in scored[1:3]]

        # Classification Thresholds
        if best_score > 0.85:
            status = "auto_assigned"
        elif best_score > 0.65:
            status = "suggested"
        else:
            status = "queued"

        return {
            "opportunity_id": str(opportunity.id),
            "assigned_profile_id": best_profile if status == "auto_assigned" else None,
            "confidence": round(best_score, 4),
            "status": status,
            "reason": [
                "highest_match_score",
                "available_now" if status == "auto_assigned" else "partial_fit"
            ],
            "fallback_candidates": fallback_candidates
        }

opportunity_allocator = OpportunityAllocator()
