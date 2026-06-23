// apps/api/src/tests/sanas/calibrationEngine.ts

export interface CalibratedSignal {
    raw: number;
    normalized: number;
    band: "LOW" | "MEDIUM" | "HIGH";
}

export class CalibrationEngine {
    calibrate(value: number): CalibratedSignal {
        const normalized = Math.min(1, value / 100);

        let band: "LOW" | "MEDIUM" | "HIGH" = "LOW";

        if (normalized > 0.7) band = "HIGH";
        else if (normalized > 0.3) band = "MEDIUM";

        return {
            raw: value,
            normalized,
            band,
        };
    }
}
