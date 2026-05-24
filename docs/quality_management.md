# iPhande Quality & Improvement Management

## Purpose
Establish a lightweight Quality Management System (QMS) for iPhande to ensure continuous improvement, transparency, and accountability.

---

## Core Doctrine
- Mistakes must be recorded, not hidden.
- Feedback must become structured improvement.
- Issues must have status and ownership.
- Audits must check whether the system obeys its own doctrine.
- Corrective actions must be tracked to closure.
- Improvements must preserve history.
- No silent erasure.
- No fake health claims.

---

## Scope
- All operational, content, privacy, and technical flows
- User and system feedback
- Doctrine and privacy audits
- Corrective and preventive actions
- Continuous improvement tracking

---

## Modules (to be implemented)
- Feedback
- Quality Issues
- Corrective Actions
- Audit Logs
- Improvement Notes

---

## API Endpoints (planned)
- POST /api/v1/feedback
- GET /api/v1/feedback
- POST /api/v1/quality/issues
- GET /api/v1/quality/issues
- PATCH /api/v1/quality/issues/{issue_id}
- POST /api/v1/quality/corrective-actions
- GET /api/v1/quality/corrective-actions
- PATCH /api/v1/quality/corrective-actions/{action_id}
- POST /api/v1/audits
- GET /api/v1/audits
- POST /api/v1/improvements
- GET /api/v1/improvements

---

## See Also
- docs/feedback_protocol.md
- docs/audit_protocol.md
- docs/corrective_action_protocol.md
- docs/improvement_loop.md
