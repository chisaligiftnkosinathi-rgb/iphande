import { apiGet } from './apiClient';

export type MobileHandshake = {
    status: string;
    app: string;
    contract: string;
    server_time: string;
    services: {
        replay: string;
        continuity_events: string;
    };
};

export type MobileHeartbeat = {
    status: string;
    app: string;
    server_time: string;
};

export async function fetchMobileHandshake(): Promise<MobileHandshake> {
    return apiGet<MobileHandshake>('/api/v1/mobile/handshake');
}

export async function fetchMobileHeartbeat(): Promise<MobileHeartbeat> {
    return apiGet<MobileHeartbeat>('/api/v1/mobile/heartbeat');
}
