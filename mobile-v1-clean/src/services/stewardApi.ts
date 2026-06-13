import { fetchWithAuth } from '../config/api';
import { Referral, ReferralMeResponse, StewardProfile } from '../types/steward';

export const bootstrapProfile = async (): Promise<StewardProfile> => {
    console.log('Bootstrapping new steward profile...');
    return fetchWithAuth('/profiles/bootstrap', {
        method: 'POST',
    });
};

export const getMe = async (): Promise<StewardProfile> => {
    console.log('Fetching steward profile from iPhande API...');
    return fetchWithAuth('/profiles/me');
};

export const updateMe = async (data: Partial<StewardProfile>): Promise<StewardProfile> => {
    return fetchWithAuth('/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const getMyReferrals = async (): Promise<ReferralMeResponse> => {
    return fetchWithAuth('/referrals/me');
};

export const getPendingReferrals = async (): Promise<Referral[]> => {
    return fetchWithAuth('/admin/referrals/pending');
};

export const markReferralPaid = async (referralId: string): Promise<Referral> => {
    return fetchWithAuth(`/admin/referrals/${referralId}/pay`, {
        method: 'PATCH',
    });
};

export const rejectReferral = async (referralId: string): Promise<Referral> => {
    return fetchWithAuth(`/admin/referrals/${referralId}/reject`, {
        method: 'PATCH',
    });
};
