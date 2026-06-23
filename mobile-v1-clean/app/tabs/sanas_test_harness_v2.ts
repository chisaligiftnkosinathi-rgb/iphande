import { TruthLedger } from "../../../../../mobile-v1-clean/app/tabs/truthLedger";
import { EventSchemaRegistry } from "./eventSchemaRegistry";
import { GovernedCrossStewardReconciler } from "./governedReconciler";
import { ProvenanceGuard } from "./provenanceGuard";
import { VersionedCalibrationEngine } from "./versionedCalibration";

const ledger = new TruthLedger();
const schema = new EventSchemaRegistry();
const guard = new ProvenanceGuard();
const calibrator = new VersionedCalibrationEngine(1);

// register schema
schema.register({
    type: "SIGNAL_INGESTED",
    version: 1,
    requiredFields: ["amount"],
});

function emit(event: any, provenance: { source: "system" | "steward" | "external", trustLevel: number } = { source: "steward", trustLevel: 1 }) {
    if (!guard.validate(provenance)) {
        console.log("❌ blocked provenance");
        return;
    }

    if (!schema.validate(event.type, event.version, event.payload)) {
        console.log("❌ schema violation");
        return;
    }

    ledger.append(event);
}

// --------------------
// Steward activity
// --------------------

emit({
    id: "1",
    stewardId: "A",
    type: "SIGNAL_INGESTED",
    timestamp: Date.now(),
    payload: { amount: 40 },
    version: 1,
});

// calibration layer injection
const cal = calibrator.calibrate(40);

ledger.append({
    id: "1-cal",
    stewardId: "A",
    type: "CALIBRATION_APPLIED",
    timestamp: Date.now(),
    payload: cal,
    version: 1,
});

// --------------------
// Governance reconciliation
// --------------------

const reconciler = new GovernedCrossStewardReconciler(ledger);

console.log("\n🌐 SANAS GOVERNED OUTPUT:");
console.log(reconciler.reconcile());
