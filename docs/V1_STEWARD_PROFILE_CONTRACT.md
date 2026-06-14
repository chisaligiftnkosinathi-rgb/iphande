# V1 Steward Profile Contract

## Architectural Premise
Firebase Authentication is the Identity Gatekeeper. It yields a `uid`.
The iPhande API (PostgreSQL/Supabase) is the Source of Truth for the Steward Profile.

**Flow:**
`Firebase Auth -> uid -> iPhande API -> Steward Profile -> Dashboard`

---

## 1. Required Core Fields
The V1 Steward Profile must fulfill this canonical interface:

```typescript
interface StewardProfile {
  uid: string;
  businessName: string;
  archetype: string;
  category: string;
  mainService: string;
  whatsapp: string;
  location: string;
  activationStatus: "pending" | "active";
  onboardingComplete: boolean;
}
```

---

## 2. V1 Archetypes (VBA Alignment)
The `archetype` drives the dashboard experience. Current supported V1 archetypes include:

* **Trades & Construction:** Construction, Plumber, Electrician, Welder, Bricklayer, Tiler, Painter, Gardener, Mechanic
* **Community & Care:** Church / Community Steward, Funeral Cover & Insurance, Tutoring
* **Services & Retail:** Hair & Beauty, Food, Cleaning, Upholsterer, Transport
* **Professional & Creative:** Real Estate & Property, Sales & Commission Agents, Digital Services, Creative Steward
* **Catch-all:** Other

---

## 3. Activation Rules
* A steward cannot access the V1 Dashboard if `onboardingComplete` is `false`.
* A steward cannot access the V1 Dashboard if `activationStatus` is `pending`.
* Both must be verified by the iPhande API before the gate opens.

---

## 4. Dashboard Personalization Rules
The V1 Home Dashboard dynamically adapts its tools and metric cards based on the `archetype`:

* **Construction / Trades (e.g., Plumber, Welder):**
  * Surfaces: Quotes, Materials Calculator, Proof Photos, Jobs
* **Mechanic:**
  * Surfaces: Vehicles, Repairs, Quotes, Parts
* **Hair & Beauty:**
  * Surfaces: Bookings, Gallery, Clients
* **Food:**
  * Surfaces: Menu, Orders, Sales
* **Commission Stewards (e.g., Real Estate, Funeral Cover):**
  * Surfaces: Client Pipeline, Commission Ledger, Follow-up Reminders
