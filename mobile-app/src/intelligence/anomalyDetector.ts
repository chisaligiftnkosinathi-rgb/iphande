import { EventItem, eventStream } from '../state/eventStream';

export interface AnomalyReport {
    hasAnomaly: boolean;
    type: 'LATENCY_SPIKE' | 'STABILITY_FAULT' | 'NONE';
    description: string;
}

export class AnomalyDetector {
    private static LATENCY_THRESHOLD_MS = 600;

    /**
     * Analyzes an array of runtime events to isolate structural processing anomalies
     */
    public static analyzeStream(events: EventItem[]): AnomalyReport {
        if (events.length === 0) {
            return { hasAnomaly: false, type: 'NONE', description: 'No events logged.' };
        }

        // 1. Evaluate stability faults (Multiple consecutive API drop signals)
        const recentErrors = events.slice(0, 3).filter(e => e.type === 'API_ERROR').length;
        if (recentErrors >= 2) {
            return {
                hasAnomaly: true,
                type: 'STABILITY_FAULT',
                description: 'Multiple backend interaction failures detected in short window.',
            };
        }

        // 2. Evaluate unexpected latency spikes
        const latestSuccess = events.find(e => e.type === 'API_SUCCESS');
        if (latestSuccess && latestSuccess.meta && typeof latestSuccess.meta.latency === 'number') {
            const currentLatency = latestSuccess.meta.latency;
            if (currentLatency > this.LATENCY_THRESHOLD_MS) {
                return {
                    hasAnomaly: true,
                    type: 'LATENCY_SPIKE',
                    description: `API latency reached ${currentLatency}ms, exceeding safe baseline limits.`,
                };
            }
        }

        return { hasAnomaly: false, type: 'NONE', description: 'System behavior within baseline.' };
    }
}