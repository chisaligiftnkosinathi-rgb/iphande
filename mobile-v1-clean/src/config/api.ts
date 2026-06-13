import { supabase } from '../lib/supabase';

// Use your Expo env variable, fallback to local python API server
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // Get the fresh Supabase JWT
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    console.log("CURRENT USER:", session?.user?.id, session?.user?.email);
    console.log("TOKEN EXISTS:", !!token);
    console.log("TOKEN:", token?.substring(0, 50), "...");

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    console.log("AUTH HEADER:", token ? `Bearer ${token.substring(0, 20)}...` : "NO TOKEN");

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
