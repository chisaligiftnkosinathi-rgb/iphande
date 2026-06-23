// apps/api/src/tests/sanas_constitution_v2/sanas_constitution_v2_test.ts

import {
    TruthConstitutionV1,
    epistemicNoLowTrustExternalOverride,
    ethicalNoRealityFabrication,
    governanceMinStewardHistory,
    integrityCalibrationConsistency,
} from "../sanas_constitution/truthConstitutionV1";
import { ConstitutionComparator } from "./constitutionComparator";
import { ConstitutionRegistry } from "./constitutionRegistry";
import { ConstitutionSimulator } from "./constitutionSimulator";

// ---------------------
// Build Constitution v1
// ---------------------
const v1 = new TruthConstitutionV1();
v1.register(epistemicNoLowTrustExternalOverride);
v1.register(governanceMinStewardHistory);
v1.register(integrityCalibrationConsistency);
v1.register(ethicalNoRealityFabrication);

// ---------------------
// Build Constitution v2 (stronger rules)
// ---------------------
const v2 = new TruthConstitutionV1();
v2.register(epistemicNoLowTrustExternalOverride);
v2.register(governanceMinStewardHistory);
v2.register(integrityCalibrationConsistency);
v2.register(ethicalNoRealityFabrication);

// NEW RULE (stricter governance)
v2.register({
    id: "governance.high_value_requires_history_5",
    category: "GOVERNANCE",
    description: "High value signals require 5+ steward history",
    evaluate: (event, ctx) => {
        if (event.type !== "SIGNAL_INGESTED") return { allowed: true };
        if ((ctx.stewardHistoryCount ?? 0) < 5 && event.payload.amount > 50) {
            return {
                allowed: false,
                reason: "v2 stricter governance: requires 5+ history",
            };
        }
        return { allowed: true };
    },
});

// ---------------------
// Registry
// ---------------------
const registry = new ConstitutionRegistry();
registry.registerVersion("v1", v1);
registry.registerVersion("v2", v2);

// ---------------------
// Simulation Input
// ---------------------
const events = [
    {
        type: "SIGNAL_INGESTED",
        payload: { amount: 40 },
        stewardId: "A",
    },
    {
        type: "SIGNAL_INGESTED",
        payload: { amount: 80 },
        stewardId: "A",
    },
];

// ---------------------
// Context builder
// ---------------------
function contextFactory(event: any) {
    return {
        stewardHistoryCount: event.stewardId === "A" ? 2 : 0,
        isExternalSource: false,
        trustScore: 1,
    };
}

// ---------------------
// Run simulations and Compare
// ---------------------
const simulator = new ConstitutionSimulator();
const resultV1 = simulator.run(v1, events, contextFactory);
const resultV2 = simulator.run(v2, events, contextFactory);
const comparator = new ConstitutionComparator();

console.log("\n📊 V1 vs V2 COMPARISON:");
console.log(comparator.compare(resultV1, resultV2));
