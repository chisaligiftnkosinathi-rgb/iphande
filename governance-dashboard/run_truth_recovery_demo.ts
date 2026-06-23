import { ledger } from "../governance/ledger/TruthLedger";
import { replayEngine } from "../governance/replay/StewardReplayEngine";

const STEWARD_ID = "MEL-OS-DEMO";

function log(title: string, data?: any) {
    console.log(`\n🧭 ${title}`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

async function recover() {
    log("SANAS RECOVERY STARTED");

    // 1. Reload from SQLite
    ledger.hydrateFromDisk();

    log("Ledger restored", {
        totalEvents: ledger.getAll().length,
    });

    // 2. Replay state
    const recoveredState = replayEngine.reconstruct(STEWARD_ID, ledger.getBySteward(STEWARD_ID));
    log("Recovered State", recoveredState);

    log("SANAS RECOVERY COMPLETE");
}

recover();
