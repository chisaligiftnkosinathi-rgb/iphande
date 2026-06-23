import { TruthLedger } from "../../../../../mobile-v1-clean/app/tabs/truthLedger";

export class GovernedCrossStewardReconciler {
    constructor(private ledger: TruthLedger) { }

    reconcile() {
        const events = this.ledger.getGlobal();

        const result: Record<string, any> = {};

        for (const e of events) {
            if (e.type === "SIGNAL_INGESTED") {
                if (!result[e.stewardId]) {
                    result[e.stewardId] = {
                        total: 0,
                        events: 0,
                    };
                }

                result[e.stewardId].total += e.payload.amount;
                result[e.stewardId].events += 1;
            }
        }

        return {
            stewardProfiles: Object.entries(result).map(([id, data]) => ({
                stewardId: id,
                avgSignal: data.total / data.events,
                classification:
                    data.total > 50 ? "HIGH_ACTIVITY" : "LOW_ACTIVITY",
                confidence: Math.min(1, data.events / 10),
            })),
            governanceHash: this.hash(JSON.stringify(result)),
        };
    }

    private hash(input: string): string {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            hash = (hash << 5) - hash + input.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    }
}
