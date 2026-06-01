# Identity Layer Patch Log

## Patch 001: Mend ProfileScreen Fractured Identity

**Date:** 2026-06-01

### Changed File
`mobile/screens/ProfileScreen.tsx`

### Purpose
To mend the fractured identity by switching the profile loading mechanism from a hardcoded `'demo'` profile ID to the authenticated `stewardId` from `AuthContext`. This ensures the screen loads data for the real, logged-in human.

### Verification
```powershell
cd C:\Projects\iphande\mobile
npx tsc --noEmit
```

### Result
**Passed.** The command returned no output, confirming the compiler remains clean.

### Boundary Constraints
This patch was strictly bounded to `ProfileScreen.tsx`. No backend, `apiClient`, or other mobile screens were touched. The removal of `demoIdentity.ts` was explicitly deferred.

## Patch 002: Correct false local-storage save message

**Date:** 2026-06-01

### Changed File
`mobile/screens/ProfileScreen.tsx`

### Purpose
Replace the misleading save failure status text (`Save failed • stored locally`) with truthful wording (`Save failed • changes were not synced`) because no local persistence behavior is currently implemented.

### Verification
```powershell
cd C:\Projects\iphande\mobile
npx tsc --noEmit
```

### Result
**Passed.** The command returned no output, confirming the compiler remains clean.

### Boundary Constraints
This patch was strictly bounded to a single status text change in `ProfileScreen.tsx`. No backend, `apiClient`, or other mobile screens were touched. No AsyncStorage implementation was added.

## Patch 003A: Add nullable profile owner_id groundwork

**Date:** 2026-06-01

### Changed Files
`api/src/models/profile.py`
`api/src/database.py`
`api/tests/test_profile_ownership.py`

### Purpose
Add safe backend groundwork for profile ownership by introducing a nullable owner identity path and proving legacy-tolerant behavior, without enforcing non-null or changing mobile contract semantics.

### Verification
```powershell
cd C:\Projects\iphande\api
.\.venv\Scripts\python.exe -m pytest tests/test_profile_ownership.py -q
```

```powershell
cd C:\Projects\iphande\api
.\.venv\Scripts\python.exe -m pytest
```

### Result
Targeted ownership tests passed:
- `2 passed in 0.78s`

Full API suite did not complete due to an existing collection-time circular import unrelated to this step:
- `ImportError: cannot import name 'Profile' from partially initialized module 'src.models.profile'`
- Failing collection target: `tests/test_content_context_builder.py`

### Boundary Constraints
Patch 003A remained backend-only groundwork. No mobile files were changed, no non-null ownership enforcement was introduced, no unique ownership constraint was enforced, and GET `/profiles` semantics were not changed.

## Patch 003A-Followup: Resolve database/profile circular import collection blocker

**Date:** 2026-06-01

### Changed File
`api/src/database.py`

### Purpose
Resolve collection-time circular import pressure by ensuring model registration imports are deferred to `register_models()` runtime path instead of forcing import-time cycles.

### Verification
```powershell
cd C:\Projects\iphande\api
.\.venv\Scripts\python.exe -m pytest
```

### Result
- Test collection now completes successfully (79 items collected).
- Previous circular-import collection blocker is resolved (`tests/test_content_context_builder.py` now runs and passes).
- Full suite is not fully green yet: 3 failures remain in `tests/test_quote_request_continuity.py` with `409 Conflict` assertions.

### Boundary Constraints
This followup remained infrastructure-focused for collection stability. No mobile files or ownership contract wiring changes were introduced in this step.

## Patch 003B: Wire profile ownership contract (backend)

**Date:** 2026-06-01

### Changed Files
`api/src/schemas/profile_schema.py`
`api/src/routes/profile_routes.py`
`api/tests/test_profile_ownership.py`

### Purpose
Introduce explicit nullable ownership contract support by accepting and returning `owner_id`, making `POST /profiles` idempotent when `owner_id` is supplied, and adding `GET /profiles/by-owner/{owner_id}` while preserving existing `GET /profiles/{profile_id}` semantics.

### Verification
```powershell
cd C:\Projects\iphande\api
.\.venv\Scripts\python.exe -m pytest tests/test_profile_ownership.py -v
```

### Result
**Passed.**
- `5 passed, 7 warnings in 3.05s`

### Boundary Constraints
Patch 003B stayed backend-only and contract-scoped. No mobile files were changed. No non-null or unique enforcement was introduced for `owner_id`. Existing profile-id lookup semantics remain in place.

## Patch 003C: Wire mobile ownership flow to backend owner contract

**Date:** 2026-06-01

### Changed Files
`mobile/src/services/apiClient.ts`
`mobile/screens/OnboardingScreen.tsx`
`mobile/screens/ProfileScreen.tsx`

### Purpose
Bind mobile profile create/load behavior to authenticated steward ownership by adding owner-based profile fetch support, carrying `owner_id` during profile creation, and using `stewardId` as the ownership anchor across onboarding and profile save/load flows.

### Verification
```powershell
cd C:\Projects\iphande\mobile
npx tsc --noEmit
```

### Result
**Passed.**
- TypeScript compile completed with exit code `0`.

### Boundary Constraints
Patch 003C remained mobile-only ownership wiring. No backend contract semantics were changed in this step. Existing profile save and generation flow behavior was preserved outside ownership field propagation and owner-based profile lookup.

## Identity V1 Stewardship Gate: PASSED

**Date:** 2026-06-01

### Gate Evidence
- Ownership contract tests green (`tests/test_profile_ownership.py`).
- Mobile ownership wiring compiled green (`npx tsc --noEmit`).
- Supabase transaction pooler runtime connectivity verified.
- Live create/read/idempotency smoke flow verified on running API:
	- POST #1 -> Profile A
	- GET by owner -> Profile A
	- POST #2 -> Profile A
	- `same_post1_get=True`
	- `same_post1_post2=True`

### Result
A steward now resolves to a single persistent identity across Firebase Authentication, mobile client ownership wiring, API ownership contract, and Supabase persistence.

### References
- `docs/protocols/identity_manual_v1_supabase_pooler_smoke_evidence_2026-06-01.md`
- `docs/protocols/identity_manual_v1_walkthrough_intent_2026-06-01.md`
