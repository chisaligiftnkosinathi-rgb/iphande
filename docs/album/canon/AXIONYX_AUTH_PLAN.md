# AXIONYX AUTHENTICATION & GOVERNANCE PLAN

## The Breakthrough Observation
Firebase authentication is deeply woven into the Axionyx admin architecture, not just a single login page. The codebase references `useAxisAuth()`, `isAuthenticated`, `role`, `signIn`, `emailVerified`, and dozens of admin surfaces guarded by Firebase-based authentication.

### The Authentication Flow:
```text
Public Search
      ↓
Admin Area
      ↓
Calibration
      ↓
Method Recovery
      ↓
SANAS Monitor
      ↓
Truth Review
      ↓
Commercial Review
```

All of these expect:
`Firebase User → JWT Token → /api/v1/auth/me → Role Resolution → Admin Access`

---

## The Frontend/Backend Mismatch
The browser UI shows "Admin access" and "Sign out", yet the API reports:
```json
{
  "authenticated": false,
  "role": "anonymous"
}
```
**Conclusion:** The frontend either thinks it is logged in while the backend knows it isn't (an integration mismatch), or the frontend is rendering the admin navigation regardless of actual auth state.

---

## The Decision: Do Not Remove Firebase
Axionyx was clearly designed around:
`Identity → Authority → Stewardship → Truth Access`

The Truth Stack is intentionally protected. If Firebase is removed today, the Truth Stack, Certificate Access, Calibration, and Admin Tools all become effectively public. This would destroy the governance model.

---

## The Action Plan
Determine if Firebase is broken, or if it is configured correctly but no one is signed in. The evidence suggests the architecture itself is sound:
* Public Facility Search: **WORKING**
* Supabase Truth Layer: **WORKING**
* UUID Facility IDs: **WORKING**
* Certificate Governance: **WORKING**
* Truth Stack Protection: **WORKING**
* Admin UI: **WORKING**

**Missing Piece:** Authenticated Identity.

The Truth Stack is not failing. It is doing exactly what it was designed to do:
> *"Authentication is required for this action."*

That is the system protecting its deepest layer of memory.
