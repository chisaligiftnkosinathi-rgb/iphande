# The AXIONYX-iPhande River Bridge

This document describes the architectural bridge and philosophical relationship between **AXIONYX** and **iPhande**.

## The Core Philosophy

> **AXIONYX proves.**
> **iPhande preserves.**

These two systems serve distinct but complementary roles in the ecosystem, acting as two sides of the same coin.

### AXIONYX
AXIONYX is the engine of proof and verification. It operates in the realm of action, data, and hard facts.
- **Role:** Produces
- **Outputs:** Evidence, Certificates, Reports, Truth Records
- **Nature:** Analytical, Verified, Transactional

### iPhande
iPhande is the vessel of legacy and memory. It operates in the realm of meaning, context, and history.
- **Role:** Archives / Preserves
- **Outputs:** Remembrance, Preservation, Legacy, Timeline, Family History
- **Nature:** Narrative, Curated, Eternal

## The River Flow

The data flows from the point of generation (AXIONYX) to the point of permanent preservation (iPhande).

```text
AXIONYX (The Source)
    │
    │  produces
    ▼
[ Proof / Evidence / Certificates ]
    │
    │  flows into
    ▼
iPhande (The Reservoir)
    │
    │  curates into
    ▼
[ Legacy / Remembrance / Timeline ]
```

## First Shared Data Model: The Milestone / Event

To bridge the two systems, we establish a shared data model. When AXIONYX generates a significant "Truth Record" or "Certificate", it triggers the creation of an "Event" in iPhande.

### AXIONYX Record (The Proof)
```json
{
  "record_id": "axn_789012",
  "timestamp": "2026-06-21T14:00:00Z",
  "record_type": "milestone_verification",
  "issuer": "AXIONYX_CORE",
  "evidence_hash": "a1b2c3d4...",
  "status": "verified"
}
```

### iPhande Archive (The Preservation)
*Maps directly from the AXIONYX Record to the Remembrance Archive Standard.*
```json
{
  "event_type": "milestone_verification",
  "event_date": "2026-06-21",
  "archive_category": "axionyx_milestone",
  "title": "Verification of Truth Record axn_789012",
  "tags": ["axionyx", "proof", "milestone", "verified"],
  "source_record_id": "axn_789012",
  "status": "archived"
}
```

## Conclusion

By strictly separating the *proving* from the *preserving*, while simultaneously building a bridge between them, we ensure that AXIONYX remains fast and objective, while iPhande remains rich and meaningful. AXIONYX provides the structural integrity of the seed; iPhande provides the soil where it grows into a legacy.
