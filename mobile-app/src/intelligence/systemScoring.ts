export interface ScoringMetrics {
    latencyMs: number;
    consecutiveFailures: number;
    isUnreachable: boolean;
}

export class SystemScoring {
    /**
     * Computes a linear health score between 0 and 100 based on runtime telemetry
     */
    public static calculateScore(metrics: ScoringMetrics): number {
        if (metrics.isUnreachable) return 0;

        let score = 100;

        // 1. Penalize based on consecutive network failures
        // Deduct 25 points per failure drop, capping penalty at 75
        const failurePenalty = Math.min(metrics.consecutiveFailures * 25, 75);
        score -= failurePenalty;

        // 2. Penalize based on latency degradation
        // Target threshold: under 150ms is perfect. Degrades up to 1000ms.
        if (metrics.latencyMs > 150) {
            const excessLatency = metrics.latencyMs - 150;
            // Deduct 1 point for every 15ms of excess latency, cap penalty at 25
            const latencyPenalty = Math.min(Math.floor(excessLatency / 15), 25);
            score -= latencyPenalty;
        }

        // Ensure score stays bounded within [0, 100]
        return Math.max(0, Math.min(score, 100));
    }

    /**
     * Maps numerical health indices onto non-technical professional operational states
     */
    public static getTargetRating(score: number): 'OPTIMAL' | 'DEGRADED' | 'CRITICAL' {
        if (score >= 85) return 'OPTIMAL';
        if (score >= 40) return 'DEGRADED';
        return 'CRITICAL';
    }
}