from src.models.trust_score import TrustScore
from src.database import SessionLocal

def get_or_create_trust(db, profile_id: str) -> TrustScore:
    ts = db.query(TrustScore).filter(TrustScore.profile_id == profile_id).first()
    if not ts:
        ts = TrustScore(profile_id=profile_id)
        db.add(ts)
        db.commit()
        db.refresh(ts)
    return ts

def recalculate_overall(ts: TrustScore):
    ts.overall_trust = (
        (ts.completion_score * 0.4) +
        (ts.reliability_score * 0.25) +
        (ts.response_speed_score * 0.2) +
        (ts.consistency_score * 0.15)
    )
    return ts.overall_trust

def increase_exposure_confidence(db, profile_id: str, svs: float = 1.0):
    ts = get_or_create_trust(db, profile_id)
    ts.consistency_score = min(1.0, ts.consistency_score + (0.01 * svs))
    recalculate_overall(ts)
    db.commit()

def increase_engagement_trust(db, profile_id: str, svs: float = 1.0):
    ts = get_or_create_trust(db, profile_id)
    ts.response_speed_score = min(1.0, ts.response_speed_score + (0.05 * svs))
    recalculate_overall(ts)
    db.commit()

def boost_reliability(db, profile_id: str, svs: float = 1.0):
    ts = get_or_create_trust(db, profile_id)
    ts.reliability_score = min(1.0, ts.reliability_score + (0.1 * svs))
    recalculate_overall(ts)
    db.commit()

def massively_increase_all_trust(db, profile_id: str, svs: float = 1.0):
    ts = get_or_create_trust(db, profile_id)
    ts.completion_score = min(1.0, ts.completion_score + (0.2 * svs))
    ts.reliability_score = min(1.0, ts.reliability_score + (0.1 * svs))
    ts.consistency_score = min(1.0, ts.consistency_score + (0.1 * svs))
    recalculate_overall(ts)
    db.commit()

def slightly_reduce_relevance_bias(db, profile_id: str, svs: float = 1.0):
    ts = get_or_create_trust(db, profile_id)
    # Even negative actions should scale by validity, or maybe we want a raw subtraction. We'll use svs.
    ts.response_speed_score = max(0.0, ts.response_speed_score - (0.02 * svs))
    recalculate_overall(ts)
    db.commit()

def recalculate(db, profile_id: str):
    ts = get_or_create_trust(db, profile_id)
    recalculate_overall(ts)
    db.commit()
    return {"overall_trust": ts.overall_trust}
