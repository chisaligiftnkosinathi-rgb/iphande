import { auditEngine } from "../governance/audit/GovernanceAuditEngine";
import { ledger } from "../governance/ledger/TruthLedger";
import { SQLiteLedgerStore } from "../governance/persistence/SQLiteLedgerStore";
import { replayEngine } from "../governance/replay/StewardReplayEngine";

const STEWARD_ID = "MEL-OS-DEMO";
const DB_PATH = "sanas_truth.db"; // Must match the path in SQLiteLedgerStore

function log(title: string, data?: any) {
    console.log(`\n🧭 ${title}`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

// Utility to clear the database for a fresh demo run
function clearDatabase() {
    const store = new SQLiteLedgerStore(DB_PATH);
    store.clear();
    // Re-initialize the ledger after clearing the disk store
    (ledger as any).events = [];
    (ledger as any).nextSequence = 0;
}

async function runFullTruthCycleDemo() {
    log("SANAS FULL TRUTH CYCLE DEMO STARTED");

    // 0. Clean slate: Clear previous demo data
    log("Phase 0: Clearing previous demo data from SQLite");
    clearDatabase();
    log("Database cleared. Ledger reset in memory.");

    // 1. Emit events and capture pre-crash state
    log("Phase 1: Generating Events and Capturing Pre-Crash State");
    const eventsToGenerate = 5;
    for (let i = 0; i < eventsToGenerate; i++) {
        const event = ledger.append({
            stewardId: STEWARD_ID,
            type: "SIGNAL_INGESTED",
            payload: { signal: i * 10 },
            version: 1,
        });
        auditEngine.record(STEWARD_ID, "EVENT_CREATED", "SUCCESS", {
            eventId: event.id,
        });
    }

    const preCrashState = replayEngine.reconstruct(
        STEWARD_ID,
        ledger.getBySteward(STEWARD_ID)
    );
    log("State BEFORE simulated crash", preCrashState);
    log("Total events in ledger before crash:", ledger.getAll().length);

    // 2. Simulate crash: Clear in-memory state, but data persists on disk
    log("💥 Phase 2: SIMULATING SYSTEM CRASH (clearing in-memory ledger)");
    (ledger as any).events = []; // Directly manipulate for simulation
    (ledger as any).nextSequence = 0; // Reset sequence
    log("In-memory ledger cleared. Data should persist in SQLite.");
    log("Total events in memory after simulated crash:", ledger.getAll().length);

    // 3. Recovery: Hydrate ledger from disk
    log("🔄 Phase 3: RECOVERING SYSTEM STATE from disk");
    ledger.hydrateFromDisk();
    log("Ledger restored from disk.", {
        totalEvents: ledger.getAll().length,
    });

    // 4. Replay and Verify
    log("✅ Phase 4: REPLAYING EVENTS and VERIFYING INTEGRITY");
    const recoveredState = replayEngine.reconstruct(
        STEWARD_ID,
        ledger.getBySteward(STEWARD_ID)
    );
    log("Recovered State", recoveredState);

    // Compare states
    const statesMatch = JSON.stringify(preCrashState) === JSON.stringify(recoveredState);
    if (statesMatch) {
        log("✨ VERIFICATION SUCCESS: Pre-crash state matches recovered state!");
    } else {
        log("❌ VERIFICATION FAILURE: States do NOT match!");
        console.error("Pre-crash state:", preCrashState);
        console.error("Recovered state:", recoveredState);
        process.exit(1); // Exit with error code
    }

    log("SANAS FULL TRUTH CYCLE DEMO COMPLETE");
}

runFullTruthCycleDemo();
