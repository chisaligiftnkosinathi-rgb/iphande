export interface CalibratedSignal {
    raw: number;
    normalized: number;
    band: "LOW" | "MEDIUM" | "HIGH";
    calibrationVersion: number;
}

export class VersionedCalibrationEngine {
    constructor(private version: number = 1) { }

    calibrate(value: number): CalibratedSignal {
        const normalized = Math.min(1, value / 100);

        let band: "LOW" | "MEDIUM" | "HIGH" = "LOW";

        if (normalized > 0.7) band = "HIGH";
        else if (normalized > 0.3) band = "MEDIUM";

        return {
            raw: value,
            normalized,
            band,
            calibrationVersion: this.version,
        };
    }
}
