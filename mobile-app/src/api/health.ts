import { apiClient } from './client';

export interface HealthResponse {
    status: 'alive' | 'degraded' | 'down';
    version: string;
    environment: string;
}

export interface TimedPayload<T> {
    data: T;
    latencyMs: number;
}

export const healthApi = {
    /**
     * Contacts raw health checkpoint endpoint directly
     */
    fetchStatus: async (): Promise<TimedPayload<HealthResponse>> => {
        const start = Date.now();
        const response = await apiClient.get<HealthResponse>('/health');
        const end = Date.now();

        return {
            data: response.data,
            latencyMs: end - start,
        };
    },
};