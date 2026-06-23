export interface Provenance {
    source: "system" | "steward" | "external";
    trustLevel: number; // 0–1
}

export class ProvenanceGuard {
    validate(provenance: Provenance): boolean {
        if (provenance.trustLevel < 0.2) return false;
        if (provenance.source === "external" && provenance.trustLevel < 0.7)
            return false;

        return true;
    }
}
