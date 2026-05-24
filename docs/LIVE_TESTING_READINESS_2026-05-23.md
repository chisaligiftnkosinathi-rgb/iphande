# Live Testing Readiness

**Date:** 2026-05-23

## Backend

Run the API on the LAN for phone testing:

```powershell
cd C:\Projects\iphande\api
.\.venv\Scripts\activate
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

## Mobile

Point Expo at the laptop LAN address:

```powershell
cd C:\Projects\iphande\mobile
$env:EXPO_PUBLIC_API_URL="http://YOUR_LAPTOP_LAN_IP:8000/api/v1/"
npm start
```

## Environment Boundary

- Backend secrets and database URLs belong in `.env`.
- Mobile public configuration must use `EXPO_PUBLIC_` variables only.
- Do not commit real production secrets.

## Live Flow Checklist

- API health endpoint returns `status: alive`.
- Content generation succeeds.
- Replay timeline loads from the configured API.
- Event detail opens from a timeline item.
- Entity replay opens from event detail.
- Causal graph opens from event detail.
- Generated content graph shows 4 nodes and 3 edges.

## Non-Blocking Warnings

- Pydantic V2 validator migration remains.
- Pydantic `ConfigDict` migration remains.
