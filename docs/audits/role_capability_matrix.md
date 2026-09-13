# Roles & Permissions Audit

## Discovered Roles
Based on the database schema (`api/src/models/`) and backend logic:
- **Business Owner / Merchant**: Possesses a `MerchantAccount`, issues quotes, receives payments.
- **Customer / Client**: Receives quotes, makes payments.
- **Steward / Admin**: Internal operators with elevated access.
- **Developer / System (S2S)**: RS256 `kid` based authentication for backend-to-backend integrations.

## Matrix
| Capability | Business Owner | Customer | Steward | System |
| ---------- | -------------- | -------- | ------- | ------ |
| Issue Quotes | Yes | No | No | No |
| Pay Invoices | No | Yes | No | No |
| Access Ledgers | Yes (Own) | No | Yes (All) | No |
| Issue S2S Tokens | No | No | No | Yes |

**Gap**: The frontend has no role-based routing or authentication guards implemented.
