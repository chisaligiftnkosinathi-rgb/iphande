import { API_BASE_URL } from '../config/api';
import { OpportunityCreate, OpportunityOut, OpportunityUpdate } from '../types/opportunity';

export async function fetchOpportunities(filters?: {
  profile_id?: string;
  province?: string;
  town_or_city?: string;
  category_key?: string;
  q?: string;
}): Promise<OpportunityOut[]> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.profile_id) params.append('profile_id', filters.profile_id);
    if (filters.province) params.append('province', filters.province);
    if (filters.town_or_city) params.append('town_or_city', filters.town_or_city);
    if (filters.category_key) params.append('category_key', filters.category_key);
    if (filters.q) params.append('q', filters.q);
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/opportunities${queryStr}`);
  
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`fetchOpportunities Error [${response.status}]:`, text);
    throw new Error('Failed to fetch opportunities');
  }
  return response.json();
}

export async function createOpportunity(data: OpportunityCreate): Promise<OpportunityOut> {
  const response = await fetch(`${API_BASE_URL}/opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`createOpportunity Error [${response.status}]:`, text);
    throw new Error('Failed to create opportunity');
  }
  return response.json();
}

export async function updateOpportunity(id: string, update: OpportunityUpdate): Promise<OpportunityOut> {
  const response = await fetch(`${API_BASE_URL}/opportunities/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`updateOpportunity Error [${response.status}]:`, text);
    throw new Error('Failed to update opportunity');
  }
  return response.json();
}
