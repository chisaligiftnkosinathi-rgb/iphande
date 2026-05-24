# iPhande Deployment Guide

## Local Development
- Activate venv: .venv\Scripts\Activate.ps1
- Start server: uvicorn src.main:app --reload --host 127.0.0.1 --port 8010
- Ensure data directory exists for SQLite

---

## Environment Variables
- Configure DB path, secret keys, etc. as needed

---

## Production Deployment
- Recommended: Railway, Render, or similar
- Use PostgreSQL for production
- Set environment variables for DB and secrets
- Use process manager (e.g., gunicorn, systemd)

---

## Database
- SQLite for dev, PostgreSQL for prod
- Use Alembic for migrations if needed
- Backup regularly

---

## Storage
- Plan for cloud storage for media (pending)

---

## Backups
- Regularly backup DB and media

---

## See Also
- docs/operating_docs.md
