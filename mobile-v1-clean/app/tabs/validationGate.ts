// apps/api/src/tests/sanas/validationGate.ts

import { TruthEvent } from "./truthLedger";

export interface ValidationResult {
    allowed: boolean;
    reason?: string;
}

export class ValidationGate {
    validate(event: TruthEvent): ValidationResult {
        // Rule 1: must have stewardId
        if (!event.stewardId) {
            return { allowed: false, reason: "Missing stewardId" };
        }

        // Rule 2: payload must exist
        if (event.payload === undefined) {
            return { allowed: false, reason: "Missing payload" };
        }

        // Rule 3: signal bounds sanity
        if (event.type === "SIGNAL_INGESTED") {
            if (event.payload.amount < 0 || event.payload.amount > 100) {
                return {
                    allowed: false,
                    reason: "Signal out of SANAS bounds (0–100)",
                };
            }
        }

        return { allowed: true };
    }
}
