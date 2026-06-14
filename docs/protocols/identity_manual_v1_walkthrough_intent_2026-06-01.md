# Manual V1 Identity Walkthrough - Intent Record

Date: 2026-06-01
Alignment: Yes-Spirit lead
Cycle: Manual V1 Identity Walkthrough

## Protocol Status
- Next Cycle: Manual V1 Identity Walkthrough
- Stage A (Intent): Ready
- Stage B (Observe): Pending

## Runtime Objective
Move from code truth to runtime truth by validating that identity ownership remains stable across onboarding, restart, profile load, and repeat save.

## Walkthrough Steps (Observe Only)
1. Start API.
2. Start mobile app.
3. Create or sign in with a real Firebase user.
4. Complete onboarding.
5. Confirm profile saves.
6. Close and reopen app.
7. Open Profile screen.
8. Confirm profile loads for the same user.
9. Press save again.
10. Confirm no duplicate profile is created.

## Evidence To Capture
- screen behavior
- console error
- API error
- network response
- database row count (if checked)

## Suggested Observation Commands
Use these only as observation support while running the walkthrough.

### Start API
```powershell
Set-Location C:\Projects\iphande\api
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 8000
```

### Start Mobile
```powershell
Set-Location C:\Projects\iphande\mobile
npx expo start
```

### Optional DB Reality Check (no schema mutation)
```powershell
Set-Location C:\Projects\iphande\api
.\.venv\Scripts\python.exe -c "import sqlite3; c=sqlite3.connect('data/iphande.db'); cur=c.cursor(); print('profiles_total=', cur.execute('select count(*) from profiles').fetchone()[0]); print('distinct_owner_ids=', cur.execute('select count(distinct owner_id) from profiles where owner_id is not null').fetchone()[0]); c.close()"
```

## Observation Log Template
Fill this section during Stage B so replay evidence stays immutable.

- Timestamp:
- Firebase user uid:
- API base URL used by mobile:
- Step 4 onboarding outcome:
- Step 5 save outcome:
- Step 8 reload outcome:
- Step 10 duplicate check outcome:
- Any console errors:
- Any API errors:
- Any network payloads/responses captured:
- DB row count snapshots:
- Verdict:

## Exit Criteria
- Same Firebase user identity maps to the same backend profile after restart.
- Repeat save does not create a second profile for the same owner_id.
- No blocking runtime/API errors.

## Boundary
This document records intent and observation procedure only. No code changes are authorized within this cycle until Stage B evidence is captured and interpreted.
