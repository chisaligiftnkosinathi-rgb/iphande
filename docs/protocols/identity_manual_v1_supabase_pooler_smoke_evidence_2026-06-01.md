# Identity Manual V1 Supabase Pooler Smoke Evidence

Date: 2026-06-01
Environment: development
Connection path: Supabase Transaction Pooler

## Context
- Direct DB host path was not reachable from this machine (DNS/IPv6 path issue).
- Pooler hostname resolved to IPv4 and was reachable by Python runtime.
- API started with explicit environment loading from `api/.env`.

## Runtime Commands Executed

Start API with deterministic app/env loading:

```powershell
C:\Projects\iphande\api\.venv\Scripts\python.exe -m uvicorn src.main:app --app-dir C:\Projects\iphande\api --env-file C:\Projects\iphande\api\.env --reload --host 127.0.0.1 --port 8000
```

Health check:

```powershell
curl http://127.0.0.1:8000/health
```

Ownership smoke flow:

```powershell
$owner = "manual_test_owner_$(Get-Date -Format yyyyMMddHHmmss)"
$body = @{
  name = "Manual Supabase Test"
  slug = "manual-supabase-test-$owner"
  email = "$owner@example.com"
  owner_id = $owner
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/profiles" -Method POST -ContentType "application/json" -Body $body
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/profiles/by-owner/$owner" -Method GET
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/profiles" -Method POST -ContentType "application/json" -Body $body
```

## Evidence Snapshot
- owner_id used: `manual_test_owner_20260601131450`
- POST 1 profile id: `d6cd9d41-43d3-41df-9344-cb6e84e6410c`
- GET by owner profile id: `d6cd9d41-43d3-41df-9344-cb6e84e6410c`
- POST 2 profile id: `d6cd9d41-43d3-41df-9344-cb6e84e6410c`

## Assertions
- `same_post1_get = True`
- `same_post1_post2 = True`

## Result
- Live ownership contract behavior is verified against Supabase via pooler path:
  - First POST created the profile.
  - GET by owner returned the same profile.
  - Second POST was idempotent and returned the same profile id.

## Security Boundary
- `.env` remained local and was not committed.
- Password was entered via terminal secure prompt and URL-encoded for `DATABASE_URL`.
