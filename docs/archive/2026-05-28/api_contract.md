# iPhande API Contract

## Purpose

Defines the backend API endpoints, payloads, schemas, and response contracts for all frontend and mobile integrations.

---

## Base URL
- Local development: http://127.0.0.1:8000/api/v1/
- Phone testing: http://YOUR_LAPTOP_LAN_IP:8000/api/v1/

---

## Core Endpoints

### Profiles
- POST /profiles
- GET /profiles/{profile_id}
- PATCH /profiles/{profile_id}/location
- GET /public/{slug}

### Opportunities
- POST /opportunities
- GET /opportunities
- PATCH /opportunities/{opportunity_id}
- POST /opportunities/{opportunity_id}/timeline
- GET /opportunities/{opportunity_id}/timeline

### Content Posts
- POST /content-posts
- GET /content-posts
- POST /content-posts/generate
- GET /content-posts/business-lines

### Continuity Events
- GET /continuity-events/business/{business_owner_id}
- GET /continuity-events/{event_id}
- GET /continuity-events/{event_id}/graph
- GET /continuity-events/entity/{entity_id}
- GET /continuity-events/parent/{event_id}/children

### Media
- POST /media
- GET /media

### Reflections
- POST /reflections
- GET /reflections

### Campaigns
- POST /campaigns
- GET /campaigns

### Message Templates
- POST /message-templates
- GET /message-templates

### Scripture Reflections
- POST /scripture-reflections
- GET /scripture-reflections

---

## Payload & Response Structure
- All endpoints use JSON payloads.
- All responses are JSON objects or arrays.
- See OpenAPI docs for full schema details.

---

## Error Handling
- 422: Validation error (with details)
- 404: Not found
- 500: Internal server error
- All errors return JSON with 'detail' field

---

## Mobile Expectations
- All endpoints CORS-enabled
- Consistent response models for mobile parsing
- Predictable error structures

---

## Versioning
- All endpoints under /api/v1/

---

## See Also
- docs/operating_docs.md
- docs/mobile_integration.md
