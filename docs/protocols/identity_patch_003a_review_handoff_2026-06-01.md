# Identity Patch 003A Review Handoff (2026-06-01)

align:: Yes-Spirit lead.

Stage D Review outcome:

Do not implement the full ownership contract yet.

Patch 003 must be split.

Prepare Patch 003A only.

Scope:
- Backend only.
- Add nullable profile ownership column safely.
- Add SQLite schema helper in api/src/database.py for profiles table.
- Register that helper in create_tables().
- Add minimal backend test proving the profiles table can tolerate the ownership column.
- Do not change mobile.
- Do not change ProfileScreen.
- Do not change OnboardingScreen.
- Do not enforce non-null.
- Do not make unique constraint yet unless SQLite-safe and test-backed.
- Do not change GET /profiles semantics yet.

Return proposed file changes only.
Do not patch until approved.

## Governance Note

Reason for split:
- Current backend uses create_all + manual SQLite ALTER TABLE helpers.
- No profile ownership migration helper exists yet.
- No profile contract test exists yet.
- Direct non-null owner_id would be high risk for existing SQLite data.
