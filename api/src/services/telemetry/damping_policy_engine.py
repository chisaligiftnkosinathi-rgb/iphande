class DampingPolicyEngine:
    def apply_damping(self, drift_type: str, drift_score: float) -> dict:
        if drift_score < 0.2:
            return {"action": "none", "effects": {}}

        if drift_score < 0.5:
            return {
                "action": "soft_damp",
                "effects": {
                    "reduce_match_sensitivity": 0.1,
                    "reduce_demand_weight": 0.1
                }
            }

        if drift_score < 0.75:
            return {
                "action": "medium_damp",
                "effects": {
                    "reduce_match_sensitivity": 0.25,
                    "cap_auto_allocation": True
                }
            }

        return {
            "action": "hard_stabilize",
            "effects": {
                "freeze_allocator": True,
                "force_cache_mode": True
            }
        }

damping_policy_engine = DampingPolicyEngine()
