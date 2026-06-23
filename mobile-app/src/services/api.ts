import axios from 'axios';
import { eventStream } from '../state/eventStream';

const API_BASE_URL = 'https://iphande-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface HealthResponse {
  status: 'alive' | 'degraded' | 'down';
  version: string;
  environment: string;
}

export interface TimedResponse<T> {
  data: T;
  latencyMs: number;
}

export const apiService = {
  getHealth: async (): Promise<TimedResponse<HealthResponse>> => {
    const start = Date.now();

    eventStream.add({
      type: 'API_CALL',
      message: 'GET /health',
    });

    try {
      const response = await api.get<HealthResponse>('/health');
      const latency = Date.now() - start;

      eventStream.add({
        type: 'API_SUCCESS',
        message: 'Health checkpoint verified',
        meta: { latency },
      });

      eventStream.add({
        type: 'LATENCY_SAMPLE',
        message: `${latency}ms telemetry registered`,
      });

      return {
        data: response.data,
        latencyMs: latency,
      };
    } catch (e) {
      eventStream.add({
        type: 'API_ERROR',
        message: 'Health checkpoint dropped or unreachable',
      });
      throw e;
    }
  },
};
