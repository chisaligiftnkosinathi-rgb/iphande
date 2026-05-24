# iPhande API Deployment

## Target Shape

```text
GitHub repo -> Railway API service -> mobile app API URL
```

Deploy the API first. The FastAPI app lives in `api`, and Railway should use that folder as the service root.

## Railway Settings

- Root directory: `api`
- Start command: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`

The same values are also captured in `api/railway.toml`.

## Environment

Start with these Railway variables:

```text
APP_NAME=iPhande API
ENVIRONMENT=production
API_VERSION=0.1.0
CORS_ORIGINS=*
```

For the first online smoke test, the API can fall back to its local SQLite path inside the Railway filesystem. For production, set `DATABASE_URL` to Railway PostgreSQL or another persistent database. Do not rely on `api/data/iphande.db` as long-term hosted storage.

## Verification

After Railway deploys, open:

```text
https://your-railway-url/health
```

Expected response:

```json
{
  "status": "alive",
  "app": "iPhande API",
  "version": "0.1.0",
  "environment": "production"
}
```

Then update the mobile app API base URL to:

```text
https://your-railway-url
```

## Git Note

`mobile` currently has its own `.git` directory. If the goal is one GitHub repository for the whole `C:\Projects\iphande` workspace, remove or archive `mobile/.git` intentionally before the first root commit so the mobile files are tracked as normal project files.
