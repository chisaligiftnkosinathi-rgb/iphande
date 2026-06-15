# iPhande V1 Business Order & Journeys

## 1. V1 Target Journeys

### A. Customer Journey
The Customer acts as a buyer of services or a poster of local opportunities:
1. **Welcome Screen / Landing Page**: Discovers iPhande.
2. **Explore Services (`/public/explore`)**: Browses active business opportunities and verified stewards.
3. **View Public Profile (`/public/[slug]`)**: Reviews a steward's category, biography, location, and verified Continuity Timeline.
4. **Contact Provider**: Direct WhatsApp or phone path from public profile to initiate work.
5. **Post Opportunity (`/opportunities/new`)**: Posts local needs. Specifying: Title, description, province, town/city, category, contact information, and optional GPS location.

### B. Steward Journey
The Steward operates a local business and records history:
1. **Register/Login (`/auth/register` or `/auth/login`)**: Establishes user session.
2. **Onboarding (`/onboarding`)**: Bootstraps profile, setting Archetype, category, name, and contact paths.
3. **Payment Verification (`/payment-verification`)**: Acknowledges R120 activation fee, transfers funds, and uploads payment proof URL or transaction ID.
4. **Activation Gate**: Waits for System Admin or System Creator review. Once approved:
   - Profile status switches to `approved`.
   - `is_verified` and `is_active` set to `true`.
5. **Update Location**: Sets business location pin in `/profile/settings` for customer calculations.
6. **Browse Opportunities (`/tabs/index`)**: Views and contacts local customer leads.
7. **Quote Builder (`/tools/calculator`)**: Builds professional quotes linked to leads.
8. **Steward Timeline (`/tabs/timeline`)**: Captures and shows proof of work, expenses, or client outcomes on their public history card.

### C. Admin Journey
The Administrator moderate users, verifies payments, and maintains system integrity:
1. **Login**: Authenticates as admin.
2. **Admin Portal (`/admin`)**: Accesses the administration tools.
3. **Payment Proof Reviews (`/admin/payment-proofs`)**: Inspects uploaded receipts, approves to activate user, or rejects with an explanation.
4. **User Management (`/admin/users`)**: Lists profiles and promotes/demotes administrators.
5. **VBA Console (`/admin/vba-console`)**: Telemetry overview showing active count stats.

---

## 2. Refined Platform Identity Layer

Identity determines feature access and dashboard presentation separate from raw security roles:

| Platform Identity | Allowed Roles | Access level | Responsibilities | Home Dashboard Experience |
| :--- | :--- | :--- | :--- | :--- |
| **SYSTEM_CREATOR** | `admin` | Level 5 (Max) | Full access, system architecture, admin promotion/demotion, doctrine management | Telemetry stats, Admin Portal button, full steward features, bypasses activation prompts |
| **SYSTEM_ADMIN** | `admin` | Level 4 | Payment reviews, community moderation, user promotion | Telemetry stats, Admin Portal button, full steward features, bypasses activation prompts |
| **STEWARD** | `steward` | Level 3 | Local business operations, quoting, timeline uploads | Standard Today's Summary, activation prompt banner if unapproved, business tools grid |
| **CUSTOMER** | `steward` or None | Level 2 | Post opportunities, track request status | Access to public exploration and opportunity post forms |
| **PUBLIC_VISITOR** | None | Level 1 | Browse services, view public profiles | Welcome / Landing page, explore services |

### Bootstrap Identification Rule
If `user.email === "glegacey97@gmail.com"`:
* **Platform Identity** is dynamically resolved as `SYSTEM_CREATOR`.
* **Role** is forced as `admin`.
* Bypasses the steward setup fee verification banner.
* Receives full administration portal visibility.
