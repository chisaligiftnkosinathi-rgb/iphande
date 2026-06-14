# iPhande Known Issues

## Pydantic Migration
- Some legacy code may still use orm_mode instead of from_attributes
- Watch for validation errors and update schemas as needed

---

## SQLite Limitations
- Not suitable for high-concurrency production
- Use PostgreSQL for scaling

---

## Generator Stabilization
- Ensure all content generator paths return a dictionary
- Add tests for edge cases

---

## Media Upload Gaps
- Cloud storage integration pending
- Large files may cause issues in dev

---

## Authentication Pending
- User accounts and auth flows not yet implemented

---

## Cloud Storage Pending
- Media storage is local only for now

---

## Quality & Improvement Management Layer
- Track issues with feedback, audit, corrective action, and improvement modules as they are implemented.

---

## Other
- Update this file as new issues are discovered
