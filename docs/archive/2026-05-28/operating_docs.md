# iPhande Operating Docs

## Overview

This document provides operational guidance for running, maintaining, and extending the iPhande platform.

---

## Setup & Deployment
- Backend: FastAPI, SQLite (dev), PostgreSQL (prod-ready)
- Mobile: React Native / Expo
- Install dependencies and activate virtual environment before running

---

## Development Workflow
- Use feature branches for new work
- Write tests for all new endpoints and flows
- Use OpenAPI docs for endpoint validation
- Keep architecture and SOP docs up to date

---

## Database
- Use SQLite for local development
- Ensure data directory exists before running
- Use Alembic for migrations if/when needed

---

## Privacy & Security
- Always follow privacy doctrine (see architecture.md)
- Never expose sensitive data in logs or responses

---

## Content & Reflection
- Use content generator for structured posts
- Review all generated content before sharing
- Use reflection features for operational journaling

---

## Support & Maintenance
- Monitor logs for errors
- Keep dependencies updated
- Regularly review and update SOPs and architecture docs
