# Identity Patch 003A Followup - Stage C Interpret (2026-06-01)

align:: Yes-Spirit lead.

Stage: C - Interpret only
Scope: Circular import blocker after Patch 003A groundwork

## Findings (Evidence-Based)

1. The import-cycle structure already existed:
- `api/src/services/content_context_builder.py` imports `src.models.profile`.
- `api/src/models/profile.py` imports `src.database.Base`.

2. The current hard collection blocker is triggered by import-time model registration in `api/src/database.py`:
- Model imports are now at module top-level.
- `register_models()` is currently `pass`.
- This causes eager import recursion while `Profile` is partially initialized.

3. Patch 003A ownership groundwork itself remains conceptually valid:
- `owner_id` is nullable in `api/src/models/profile.py`.
- SQLite helper `ensure_sqlite_profiles_schema()` exists in `api/src/database.py`.

## Interpret Answers

1. Is blocker pre-existing or introduced by Patch 003A?
- The cycle pattern is pre-existing, but the immediate collection-time failure is activated by top-level model imports introduced in the current `database.py` layout.

2. Smallest safe fix?
- Move model registration imports out of module import-time and back behind `register_models()` execution boundary.

3. Can `database.py` model registration be moved out of import-time cycle?
- Yes.

4. Files to touch (minimal scope)
- `api/src/database.py` only.

5. Targeted verification sequence after fix
```powershell
cd C:\Projects\iphande\api
.\.venv\Scripts\python.exe -m pytest tests/test_content_context_builder.py -q
.\.venv\Scripts\python.exe -m pytest tests/test_profile_ownership.py -q
.\.venv\Scripts\python.exe -m pytest
```

## Protocol Note

- No implementation was applied in this interpret step.
- This document is for replay and review continuity before any new patch approval.
