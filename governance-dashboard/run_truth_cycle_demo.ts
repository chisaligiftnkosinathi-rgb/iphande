import { auditEngine } from "../governance/audit/GovernanceAuditEngine";
import { ledger } from "../governance/ledger/TruthLedger";
import { replayEngine } from "../governance/replay/StewardReplayEngine";

const STEWARD_ID = "MEL-OS-DEMO";

function log(title: string, data?: any) {
    console.log(`\n🧭 ${title}`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

async function runDemo() {
    log("SANAS DEMO STARTED");

    // 1. Emit events
    log("Phase 1: Generating Events");

    for (let i = 0; i < 5; i++) {
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

    const preCrashState = replayEngine.reconstruct(STEWARD_ID, ledger.getBySteward(STEWARD_ID));
    log("State BEFORE crash", preCrashState);

    // 2. Simulate crash
    log("💥 SIMULATING SYSTEM CRASH (process reset)");

    process.exit(0);
}

runDemo();
