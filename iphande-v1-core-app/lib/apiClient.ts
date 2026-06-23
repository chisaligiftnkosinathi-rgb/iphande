const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://iphande-production.up.railway.app";

async function request(endpoint: string, options?: RequestInit) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
        },
        ...options,
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`API Error: ${error}`);
    }

    return res.json();
}

/**
 * =========================
 * PROFILES
 * =========================
 */

export const api = {
    // PROFILE
    getMyProfile: () => request("/api/v1/profiles/me"),

    listProfiles: () => request("/api/v1/profiles"),

    getProfile: (id: string) =>
        request(`/api/v1/profiles/${id}`),

    bootstrapProfile: () =>
        request("/api/v1/profiles/bootstrap", {
            method: "POST",
        }),

    // REFLECTIONS (VERY IMPORTANT FOR YOUR TRUTH SYSTEM)
    listReflections: () =>
        request("/api/v1/reflections"),

    createReflection: (data: any) =>
        request("/api/v1/reflections", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getReflection: (id: string) =>
        request(`/api/v1/reflections/${id}`),

    // OPPORTUNITIES (REAL-WORLD CONTEXT)
    listOpportunities: () =>
        request("/api/v1/opportunities"),

    // FINANCIAL CONTEXT (OPTIONAL LATER IN MIRROR)
    listFinancialEvents: (businessOwnerId: string) =>
        request(
            `/api/v1/financial-events/business/${businessOwnerId}`
        ),
};