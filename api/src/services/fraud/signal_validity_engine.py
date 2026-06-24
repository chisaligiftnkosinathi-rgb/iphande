from src.services.fraud.fraud_detector import fraud_detector

class SignalValidityEngine:
    def evaluate_event(self, event) -> float:
        # Evaluate the event and classify risk
        # Note: If event does not have an actor_id/profile_id, we might default to 1.0
        profile_id = getattr(event, 'profile_id', None) or getattr(event, 'actor_id', None)
        
        if not profile_id:
            return 1.0 # Cannot assess unknown actor

        result = fraud_detector.classify_and_record(profile_id, event)
        
        # Convert fraud score (0-100) to SVS (1.0 to 0.0)
        # 100 fraud = 0.0 SVS
        svs = 1.0 - (result["fraud_score"] / 100.0)
        
        # Ensure bounds
        svs = max(0.0, min(1.0, svs))
        
        return round(svs, 4)

fraud_engine = SignalValidityEngine()
