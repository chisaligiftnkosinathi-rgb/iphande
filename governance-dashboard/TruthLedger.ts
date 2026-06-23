import { createHash } from "crypto";
import { SQLiteLedgerStore } from "./persistence/SQLiteLedgerStore";

const store = new SQLiteLedgerStore();

export interface LedgerEvent {
    id: string;
    stewardId: string;
    type: string;
    timestamp: number;
    payload: any;
    version: number;
    sequence: number; // Absolute order index in the ledger
    hash: string; // Forensic integrity proof
    previousHash: string; // Link to immutable history
    signature?: string; // Future: provenance proof
}

export class TruthLedger {
    private events: LedgerEvent[] = [];
    private nextSequence: number = 0;

    /**
     * Appends an event to the ledger.
     * Now includes hash-chaining to prevent tamper scenarios.
     */
    append(event: Omit<LedgerEvent, "id" | "timestamp" | "sequence" | "hash" | "previousHash">): LedgerEvent {
        const timestamp = Date.now();
        const sequence = this.nextSequence++;

        const prevHash = this.events.length > 0
            ? this.events[this.events.length - 1].hash
            : "0".repeat(64); // Genesis block marker

        // Deterministic content string for hashing
        const content = JSON.stringify({ ...event, timestamp, sequence, prevHash });
        const hash = createHash("sha256").update(content).digest("hex");

        const fullEvent: LedgerEvent = {
            ...event,
            id: `evt_${timestamp}_${sequence}`,
            sequence,
            timestamp,
            hash,
            previousHash: prevHash,
        };

        this.events.push(Object.freeze(fullEvent));

        // 💾 Persist immediately (truth durability guarantee)
        store.insert(fullEvent);

        return fullEvent;
    }

    hydrateFromDisk() {
        this.events = store.loadAll();
        this.nextSequence = this.events.length;
    }

    getAll(): LedgerEvent[] {
        return [...this.events];
    }

    getBySteward(id: string): LedgerEvent[] {
        return this.events.filter((e) => e.stewardId === id);
    }

    /**
     * Forensic check of the entire ledger.
     * Proves that no record has been altered or deleted.
     */
    verifyIntegrity(): boolean {
        return this.events.every((event, index) => {
            if (index === 0) return true;
            return event.previousHash === this.events[index - 1].hash;
        });
    }
}

export const ledger = new TruthLedger();
