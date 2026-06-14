# Phase 7D — Archetype Registry Documentation Checkpoint

## Why Category Default + Override Was Chosen

- **Operational Reality:** Many business categories contain jobs with different operational physics. For example, most food businesses are velocity-driven, but catering is event-based.
- **Flexibility:** The fallback model (category default + business-line override) allows the system to represent both the general rule and important exceptions without forcing every business into a rigid mold.
- **Future-Proofing:** As new business lines are added, only overrides need to be specified for exceptions, keeping the registry maintainable and extensible.

## Why This Is Not Yet Runtime Enforcement

- **Constitutional Restraint:** The registry is a mapping layer only. No routes, state machines, templates, or UI logic are yet controlled by archetype.
- **Safety:** This prevents accidental breakage or drift while the mapping is validated and refined.
- **Auditability:** The registry can be reviewed, discussed, and improved without impacting live system behavior.

## How It Will Later Guide the System

- **Content Generation:** Archetype will select default CTAs, trust-building cues, and urgency/velocity language for captions and templates.
- **Replay Surfaces:** Determines which replay/event patterns to use for each business type (e.g., inventory velocity, event bookings, lineage stages).
- **UI Wording:** The primary action button and status displays will adapt to the archetype (e.g., "Request Quote" for lineage, "Book Slot" for temporal, "View Offer" for velocity).
- **State Machine Selection:** Instead of hardcoding logic for each business, the system will select the correct state machine DNA based on archetype.

## Verification

- The registry was created at `api/src/data/business_archetypes.py`.
- The following command passed with no errors:

  ```
  python -m py_compile C:\Projects\iphande\api\src\data\business_archetypes.py
  ```

- No runtime enforcement or system changes have been made.

---

*Checkpoint complete. Ready for next phase.*
