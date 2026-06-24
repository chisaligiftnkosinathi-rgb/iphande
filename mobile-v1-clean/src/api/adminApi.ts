import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
        throw new Error('Not authenticated');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
}

export interface DashboardStats {
    total_profiles: number;
    pending_reviews: number;
    approved_profiles: number;
    total_opportunities: number;
}

export async function getAdminDashboard(): Promise<DashboardStats> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v1/admin/dashboard`, { headers });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch dashboard stats');
    }
    return res.json();
}

export interface PaymentReview {
    profile_id: string;
    name: string;
    email: string;
    business_name?: string;
    setup_fee_status: string;
    setup_fee_proof_url?: string;
    setup_fee_review_note?: string;
}

export async function getPaymentProofs(status: string = 'pending_review'): Promise<PaymentReview[]> {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_URL}/api/v1/admin/profiles/payment-proofs`);
    if (status) {
        url.searchParams.append('status', status);
    }
    const res = await fetch(url.toString(), { headers });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch payment proofs');
    }
    return res.json();
}

export async function approvePayment(profileId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v1/admin/profiles/${profileId}/approve-payment`, {
        method: 'POST',
        headers
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to approve payment');
    }
}

export async function rejectPayment(profileId: string, reviewNote: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v1/admin/profiles/${profileId}/reject-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ review_note: reviewNote })
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to reject payment');
    }
}

export interface UserAdmin {
    id: string;
    name: string;
    email: string;
    role: string;
}

export async function getUsers(): Promise<UserAdmin[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v1/admin/users`, { headers });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch users');
    }
    return res.json();
}

export async function promoteAdmin(profileId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v1/admin/users/${profileId}/promote-admin`, {
        method: 'POST',
        headers
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to promote to admin');
    }
}

export async function demoteAdmin(profileId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/v1/admin/users/${profileId}/demote-admin`, {
        method: 'POST',
        headers
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to demote admin');
    }
}
