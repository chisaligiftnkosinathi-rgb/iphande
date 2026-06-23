// apps/api/src/tests/sanas/crossStewardReconciler.ts

import { TruthLedger } from "./truthLedger";

export class CrossStewardReconciler {
    constructor(private ledger: TruthLedger) { }

    reconcile() {
        const events = this.ledger.getGlobal();

        const stewardMap: Record<string, number> = {};

        for (const e of events) {
            if (e.type === "SIGNAL_INGESTED") {
                stewardMap[e.stewardId] =
                    (stewardMap[e.stewardId] || 0) + e.payload.amount;
            }
        }

        const insights = Object.entries(stewardMap).map(
            ([stewardId, total]) => ({
                stewardId,
                totalSignals: total,
                classification:
                    total > 50 ? "HIGH_ACTIVITY" : "LOW_ACTIVITY",
            })
        );

        return {
            stewardInsights: insights,
            globalSignalTotal: Object.values(stewardMap).reduce(
                (a, b) => a + b,
                0
            ),
        };
    }
}
