from src.services.fraud.geo_anomaly_detector import geo_anomaly_detector
from src.services.fraud.behavior_analyzer import behavior_analyzer

class FraudScorer:
    def compute_score(self, event) -> float:
        geo_risk = geo_anomaly_detector.evaluate(event)
        behavior_risk = behavior_analyzer.evaluate(event)
        trust_inconsistency = 0.0 # Stub: Check if signal conflicts with established trust patterns

        # Combines all signals into a 0-100 score
        fraud_score = (
            geo_risk * 0.35 +
            behavior_risk * 0.40 +
            trust_inconsistency * 0.25
        ) * 100
        
        return round(fraud_score, 2)

fraud_scorer = FraudScorer()
