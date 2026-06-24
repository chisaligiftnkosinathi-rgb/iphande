import { fetchWithAuth } from '../../config/api';
import { StewardProfile } from '../types/steward';

export const getPublicProfileBySlug = async (slug: string): Promise<StewardProfile> => {
    return fetchWithAuth(`/public/business/${slug}`);
};

export const fetchOpportunities = async (filters?: {
    archetype?: string;
    province?: string;
    city?: string;
}) => {
    const params = new URLSearchParams();

    if (filters?.archetype) params.append('archetype', filters.archetype);
    if (filters?.province) params.append('province', filters.province);
    if (filters?.city) params.append('city', filters.city);

    const qs = params.toString();
    return fetchWithAuth(`/public/opportunities${qs ? `?${qs}` : ''}`);
};

export const fetchArchetypes = async () => {
    return fetchWithAuth(`/public/archetypes`);
};

export const fetchArchetypeProfiles = async (archetypeKey: string) => {
    return fetchWithAuth(
        `/public/profiles?archetype=${encodeURIComponent(archetypeKey)}`
    );
};
