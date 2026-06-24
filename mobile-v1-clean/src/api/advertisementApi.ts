import { API_BASE_URL, fetchWithAuth } from '../../config/api';
import { AdvertisementCreate, AdvertisementOut } from '../types/advertisement';

export async function createPublicAdvertisement(data: AdvertisementCreate): Promise<AdvertisementOut> {
    const response = await fetch(`${API_BASE_URL}/advertisements/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create advertisement');
    }
    return response.json();
}

export async function fetchActiveAdvertisements(filters?: {
    province?: string;
    town_or_city?: string;
    category_key?: string;
    q?: string;
}): Promise<AdvertisementOut[]> {
    const params = new URLSearchParams();
    if (filters?.province) params.append('province', filters.province);
    if (filters?.town_or_city) params.append('town_or_city', filters.town_or_city);
    if (filters?.category_key) params.append('category_key', filters.category_key);
    if (filters?.q) params.append('q', filters.q);

    const qs = params.toString();
    const url = `${API_BASE_URL}/advertisements/public${qs ? `?${qs}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch advertisements');
    }
    return response.json();
}

export async function fetchPendingAdvertisements(): Promise<AdvertisementOut[]> {
    return fetchWithAuth('/admin/advertisements/pending');
}

export async function approveAdvertisement(id: string): Promise<AdvertisementOut> {
    return fetchWithAuth(`/admin/advertisements/${id}/approve`, {
        method: 'PATCH',
    });
}

export async function rejectAdvertisement(id: string): Promise<AdvertisementOut> {
    return fetchWithAuth(`/admin/advertisements/${id}/reject`, {
        method: 'PATCH',
    });
}
