from src.domain.lineage_registry import LINEAGE_REGISTRY
from src.domain.evidence_registry import EVIDENCE_REGISTRY
from src.domain.trust_registry import TRUST_LEVELS


def resolve_trust_level(score: int) -> str:
    for level, (min_val, max_val) in TRUST_LEVELS.items():
        if min_val <= score <= max_val:
            return level.title().replace("_", " ")
    return "Starting"


def calculate_trust_profile(profile, events):
    lineage_key = profile.business_line
    lineage = LINEAGE_REGISTRY.get(lineage_key)

    is_activated = bool(
        profile.is_verified and profile.is_active and profile.setup_fee_status == "approved"
    )

    verification_score = 100 if is_activated else 0

    if not lineage:
        return {
            "profile_id": str(profile.id),
            "lineage": lineage_key or "UNCLASSIFIED",
            "lineage_version": None,
            "verification_status": "Verified" if is_activated else "Pending Activation",
            "verification_score": verification_score,
            "evidence_score": 0,
            "continuity_score": 0,
            "trust_score": 0,
            "trust_level": "Unclassified" if is_activated else "Awaiting Activation",
            "required_evidence_types": [],
            "captured_evidence_types": [],
        }

    required_keys = set(lineage.get("required_evidence_types", []))
    captured_keys = set()

    for event in events:
        payload = event.payload_json or {}
        evidence_type = event.evidence_type or payload.get("evidence_type") or event.event_type

        if evidence_type in required_keys:
            captured_keys.add(evidence_type)

    required_weight = sum(
        EVIDENCE_REGISTRY.get(key, {}).get("weight", 10)
        for key in required_keys
    )

    captured_weight = sum(
        EVIDENCE_REGISTRY.get(key, {}).get("weight", 10)
        for key in captured_keys
    )

    evidence_score = (
        round((captured_weight / required_weight) * 100)
        if required_weight > 0
        else 0
    )

    continuity_score = min(100, len(events) * 5)

    if not is_activated:
        trust_score = 0
        trust_level = "Awaiting Activation"
    else:
        trust_score = round(
            (verification_score + evidence_score + continuity_score) / 3
        )
        trust_level = resolve_trust_level(trust_score)

    return {
        "profile_id": str(profile.id),
        "lineage": lineage_key,
        "lineage_version": lineage.get("version"),
        "verification_status": "Verified" if is_activated else "Pending Activation",
        "verification_score": verification_score,
        "evidence_score": evidence_score,
        "continuity_score": continuity_score,
        "trust_score": trust_score,
        "trust_level": trust_level,
        "required_evidence_types": sorted(required_keys),
        "captured_evidence_types": sorted(captured_keys),
    }
