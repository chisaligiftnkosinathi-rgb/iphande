import math

def std(data: list) -> float:
    if not data:
        return 0.0
    mean = sum(data) / len(data)
    variance = sum((x - mean) ** 2 for x in data) / len(data)
    return math.sqrt(variance)

class DriftDetector:
    def compute_drift(self, current: float, baseline: float, history: list) -> float:
        delta = abs(current - baseline)
        
        # Calculate volatility over the last 20 history points
        volatility = std(history[-20:]) if len(history) > 5 else 0.0
        
        drift_score = (delta * 0.6) + (volatility * 0.4)
        
        return min(drift_score, 1.0)

drift_detector = DriftDetector()
