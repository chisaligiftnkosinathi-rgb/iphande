import { fetchWithAuth } from '../config/api';
import { StewardProfile } from '../types/steward';

export const getPublicProfileBySlug = async (slug: string): Promise<StewardProfile> => {
    // fetchWithAuth will safely attach a token if logged in, but the endpoint can remain public on the backend
    return fetchWithAuth(`/public/${slug}`);
};
