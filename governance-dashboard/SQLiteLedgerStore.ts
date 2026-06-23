import Database from "better-sqlite3";
import { LedgerEvent } from "../TruthLedger";

export class SQLiteLedgerStore {
    private db: Database.Database;

    constructor(dbPath: string = "sanas_truth.db") {
        this.db = new Database(dbPath);
        this.init();
    }

    private init() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS ledger_events (
        id TEXT PRIMARY KEY,
        stewardId TEXT,
        type TEXT,
        timestamp INTEGER,
        sequence INTEGER,
        payload TEXT,
        version INTEGER,
        hash TEXT,
        previousHash TEXT
      )
    `);
    }

    insert(event: LedgerEvent) {
        const stmt = this.db.prepare(`
      INSERT INTO ledger_events
      (id, stewardId, type, timestamp, sequence, payload, version, hash, previousHash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            event.id,
            event.stewardId,
            event.type,
            event.timestamp,
            event.sequence,
            JSON.stringify(event.payload),
            event.version,
            event.hash,
            event.previousHash
        );
    }

    loadAll(): LedgerEvent[] {
        const rows = this.db.prepare(`SELECT * FROM ledger_events ORDER BY sequence ASC`).all();

        return rows.map((r: any) => ({
            ...r,
            payload: JSON.parse(r.payload),
        }));
    }

    loadBySteward(stewardId: string): LedgerEvent[] {
        const rows = this.db
            .prepare(`SELECT * FROM ledger_events WHERE stewardId = ? ORDER BY sequence ASC`)
            .all(stewardId);

        return rows.map((r: any) => ({
            ...r,
            payload: JSON.parse(r.payload),
        }));
    }
}
