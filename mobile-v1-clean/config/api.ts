import { supabase } from '../src/api/supabase';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
    console.warn("⚠️ EXPO_PUBLIC_API_URL is missing! API calls will fail in production.");
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // Get the fresh Supabase JWT
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    console.log("CURRENT USER:", session?.user?.id, session?.user?.email);
    console.log("TOKEN EXISTS:", !!token);

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return response.json();
}
