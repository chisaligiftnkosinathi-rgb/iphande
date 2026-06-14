# iPhande Audit Protocol

## Purpose
Ensure the system, content, and operations comply with doctrine, privacy, and quality standards.

---

## Audit Types
- privacy
- content
- replay
- API
- doctrine
- security
- QMS

---

## AuditLog Fields
- id
- audit_type
- scope
- findings
- result: pass, minor_findings, major_findings, fail
- corrective_action_required (boolean)
- created_at

---

## Protocol
1. Audits are scheduled or triggered by events/issues.
2. Each audit documents scope, findings, and result.
3. Major findings require corrective action.
4. All audits are logged and preserved.
5. Audit results are reviewed by maintainers.
6. Audit history is never erased.
