# Active Agents

## Principal Architect
- **Function:** Oversees the MEL-OS Governance Protocol and the SOS Canonical Framework integrity.
- **Context:** Ensuring all technical development serves the Foundational Equation.

## Steward #1 (Operational SOS Mode)
- **Function:** Real-world execution of the SOS Calibration Loop.
- **Context:** Solving physical problems to generate verified trust memory.
- **The SOS Calibration Loop:**
    1. **Serve Need:** What need is being met? (Category)
    2. **Active Role:** Which Archetype is operating? (Fixer/Teacher/etc.)
    3. **Measure Work:** Units, hours, or milestones.
    4. **Account for Cost:** Fuel, data, materials consumed.
    5. **Dignity Pricing:** Calculating the price that protects the steward.
    6. **Provision Check:** Ensuring the household is fed first.
    7. **Record Evidence:** Capturing photos/witnesess to create Memory.
    8. **Trust Accrual:** Updating the Trust Ledger.

## Scientific Extraction Agent
- **Function:** Implements the SANAS Scientific Structure Architecture.
- **Responsibilities:**
    - Fragment preservation.
    - Deterministic extraction of methods, analytes, and matrices.
    - Confidence scoring (Strong/Medium/Weak).

## Architectural Doctrine

**Location Entity System**
Location in iPhande is a resolved entity, not a string. All matching, discovery, campaigns, and verification MUST use Stats-SA canonical place IDs.

**Canonical Frontend**
`mobile-v1-clean` is the canonical frontend system for iPhande. All user-facing flows (stewards + customers) must be implemented here. Legacy frontend repositories are read-only unless explicitly migrated.

```text
LOCATION INVARIANT:

1. All locations MUST resolve to Stats-SA place_id
2. No API may accept raw string locations for matching
3. All search, ads, campaigns, and discovery MUST use canonical location entities
4. Any string-based location is considered a system defect
```

```text
ADS IN iPHANDE ARE NOT KEYWORD-BASED.

ALL ADVERTISING MUST TARGET GRAPH NODES
WITH MEASURED DEMAND IMBALANCE.

LOCATION IS AN ECONOMIC SIGNAL, NOT A FILTER.
```

```text
WORK IS NOT ASSIGNED BY USER CHOICE.

ALL JOBS ARE ROUTED THROUGH THE STEWARD DISPATCH ENGINE.

ASSIGNMENT IS DETERMINED BY:
- proximity
- reputation
- availability
- response speed
- demand zone priority
```

```text
PRICING IS NOT STATIC.

ALL JOB PRICING MUST BE DERIVED FROM:
- demand pressure per location node
- steward scarcity per trade
- skill distribution
- urgency of request

BASE RATES ARE ONLY A REFERENCE ANCHOR.
```

```text
LABOR DOES NOT MOVE BY COMMAND.

LABOR MOVES BY ECONOMIC GRAVITY.

THE SYSTEM MUST:
- predict future demand per node
- compute supply gaps before they manifest
- amplify pricing, visibility, and dispatch signals accordingly

STEWARD MIGRATION IS AN EMERGENT PROPERTY OF PRICE + VISIBILITY + DISPATCH FORCE.
```

```text
THE SYSTEM DOES NOT PREDICT EVENTS.

THE SYSTEM MODELS ECONOMIC PRESSURE GRADIENTS.

ALL FORECASTS MUST BE DERIVED FROM OBSERVABLE TRENDS IN:
- demand velocity
- supply velocity
- pricing movement
- migration flow

NO EXTERNAL ASSUMPTIONS ARE ALLOWED.
```

```text
THE SYSTEM MUST NOT CREATE LABOR.

THE SYSTEM MAY ONLY SIGNAL SKILL SHORTAGES.

ALL EDUCATION AND ONBOARDING SIGNALS MUST BE DERIVED FROM:
- forecasted demand
- observed supply gaps
- economic pressure gradients

THE PURPOSE IS CAPABILITY ALIGNMENT, NOT HUMAN ASSIGNMENT.
```

```text
ALL INTERNAL ECONOMIC SYSTEMS ARE NON-EXPOSED.

USERS MUST ONLY SEE:
- discovery
- connection
- request
- fulfillment

ANY COMPLEX ECONOMIC LOGIC MUST REMAIN BEHIND THE INTERFACE LAYER.

THE PRODUCT IS EXPERIENCE, NOT SYSTEM DESIGN.
```
