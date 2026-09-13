# API / Frontend Contract Audit

## Findings
- **Status**: INCONSISTENT / MISSING
- **Evidence**: The frontend does not consume the backend APIs. There are no generated API clients, no `fetch` or `axios` services mapping to the `/quotes`, `/payments`, or `/financial_events` routers.
- The contract is purely theoretical until the frontend begins integrating with the API.
