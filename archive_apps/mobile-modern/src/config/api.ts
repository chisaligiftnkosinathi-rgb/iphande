import Constants from 'expo-constants';

declare const process: {
    env?: {
        EXPO_PUBLIC_API_URL?: string;
    };
};

type ExtraConfig = {
    EXPO_PUBLIC_API_URL?: string;
    apiBaseUrl?: string;
    apiOrigin?: string;
};

const extra: ExtraConfig =
    (Constants.expoConfig?.extra as ExtraConfig) || {};

const RAILWAY_API_ORIGIN = 'https://iphande-production.up.railway.app';
const API_V1_SEGMENT = '/api/v1';

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

function normalizeApiBaseUrl(value: string): string {
    const trimmed = trimTrailingSlash(value.trim());
    if (!trimmed) return `${RAILWAY_API_ORIGIN}${API_V1_SEGMENT}`;
    return trimmed.endsWith(API_V1_SEGMENT)
        ? trimmed
        : `${trimmed}${API_V1_SEGMENT}`;
}

const configuredApiUrl =
    extra.apiBaseUrl ||
    extra.EXPO_PUBLIC_API_URL ||
    (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined) ||
    `${RAILWAY_API_ORIGIN}${API_V1_SEGMENT}`;

export const API_BASE_URL = normalizeApiBaseUrl(configuredApiUrl);

export const API_ORIGIN = trimTrailingSlash(
    extra.apiOrigin?.trim() ||
    API_BASE_URL.replace(new RegExp(`${API_V1_SEGMENT}$`), '')
);

export function buildApiUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;

    const normalizedPath = path
        .replace(/^\/+/, '')
        .replace(/^api\/v1\/?/, '');

    return `${API_BASE_URL}/${normalizedPath}`;
}

export function buildRootApiUrl(path: string): string {
    const normalizedPath = path.replace(/^\/+/, '');
    return `${API_ORIGIN}/${normalizedPath}`;
}
