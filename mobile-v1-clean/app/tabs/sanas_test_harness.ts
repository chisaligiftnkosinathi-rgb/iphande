// apps/api/src/tests/sanas/sanas_test_harness.ts

import { CalibrationEngine } from "./calibrationEngine";
import { CrossStewardReconciler } from "./crossStewardReconciler";
import { StewardReplayEngine } from "./stewardReplayEngine";
import { TruthLedger } from "./truthLedger";
import { ValidationGate } from "./validationGate";

const ledger = new TruthLedger();
const validator = new ValidationGate();
const calibrator = new CalibrationEngine();

const stewardA = "steward_A";
const stewardB = "steward_B";

// Helper
function emit(event: any) {
    const result = validator.validate(event);

    if (!result.allowed) {
        console.log("❌ Rejected:", result.reason);
        return;
    }

    ledger.append(event);
}

// --------------------------
// 1. Create Activity Stream
// --------------------------

emit({
    id: "1",
    stewardId: stewardA,
    type: "SIGNAL_INGESTED",
    timestamp: Date.now(),
    payload: { amount: 30 },
    version: 1,
});

emit({
    id: "2",
    stewardId: stewardA,
    type: "SIGNAL_INGESTED",
    timestamp: Date.now(),
    payload: { amount: 25 },
    version: 1,
});

emit({
    id: "3",
    stewardId: stewardB,
    type: "SIGNAL_INGESTED",
    timestamp: Date.now(),
    payload: { amount: 80 },
    version: 1,
});

// --------------------------
// 2. Calibration Layer
// --------------------------

for (const e of ledger.getAll()) {
    if (e.type === "SIGNAL_INGESTED") {
        const calibrated = calibrator.calibrate(e.payload.amount);

        ledger.append({
            id: `${e.id}-cal`,
            stewardId: e.stewardId,
            type: "CALIBRATION_APPLIED",
            timestamp: Date.now(),
            payload: calibrated,
            version: 1,
        });
    }
}

// --------------------------
// 3. Replay Steward State
// --------------------------

const replay = new StewardReplayEngine(ledger);

console.log("\n🧭 STEWARD A STATE:");
console.log(replay.replay(stewardA));

console.log("\n🧭 STEWARD B STATE:");
console.log(replay.replay(stewardB));

// --------------------------
// 4. Cross Steward Reconciliation
// --------------------------

const reconciler = new CrossStewardReconciler(ledger);

console.log("\n🌐 CROSS STEWARD INSIGHTS:");
console.log(reconciler.reconcile());
