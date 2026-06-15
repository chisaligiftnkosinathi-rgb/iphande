import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { bootstrapProfile, getMe } from '../services/stewardApi';
import { StewardProfile } from '../types/steward';
import { useAuth } from './AuthContext';

interface StewardContextType {
    profile: StewardProfile | null;
    isLoadingProfile: boolean;
    refreshProfile: () => Promise<void>;
    canAccess: (feature: string) => boolean;
}

const StewardContext = createContext<StewardContextType | undefined>(undefined);

export function StewardProvider({ children }: { children: ReactNode }) {
    const { user, session, isLoading: isAuthLoading } = useAuth();
    const [profile, setProfile] = useState<StewardProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const fetchProfile = async () => {
        if (!user) {
            setProfile(null);
            setIsLoadingProfile(false);
            return;
        }

        setIsLoadingProfile(true);
        try {
            const fetchedProfile = await getMe();
            
            // Platform Identity resolution
            if (user?.email?.toLowerCase() === 'glegacey97@gmail.com') {
                fetchedProfile.platform_identity = 'SYSTEM_CREATOR';
                fetchedProfile.role = 'admin';
            } else if (fetchedProfile.role === 'admin' || fetchedProfile.role === 'system_admin') {
                fetchedProfile.platform_identity = 'SYSTEM_ADMIN';
            } else {
                fetchedProfile.platform_identity = 'STEWARD';
            }

            setProfile(fetchedProfile);
        } catch (error) {
            console.warn('Profile fetch failed. Trying bootstrap...', error);

            try {
                if (!session?.access_token) throw new Error('No Supabase token available for bootstrap');

                const bootstrappedProfile = await bootstrapProfile();
                
                // Platform Identity resolution
                if (user?.email?.toLowerCase() === 'glegacey97@gmail.com') {
                    bootstrappedProfile.platform_identity = 'SYSTEM_CREATOR';
                    bootstrappedProfile.role = 'admin';
                } else if (bootstrappedProfile.role === 'admin' || bootstrappedProfile.role === 'system_admin') {
                    bootstrappedProfile.platform_identity = 'SYSTEM_ADMIN';
                } else {
                    bootstrappedProfile.platform_identity = 'STEWARD';
                }

                setProfile(bootstrappedProfile);
            } catch (bootstrapError) {
                console.error('Profile bootstrap failed:', bootstrapError);
                setProfile(null);
            }
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading) fetchProfile();
    }, [user, isAuthLoading]);

    const canAccess = (feature: string): boolean => {
        if (!profile) return false;
        if (
            profile.role === 'admin' ||
            profile.role === 'system_admin' ||
            profile.platform_identity === 'SYSTEM_CREATOR' ||
            profile.platform_identity === 'SYSTEM_ADMIN'
        ) {
            return true;
        }
        if (!profile.allowed_features) return false;
        return profile.allowed_features.includes(feature);
    };

    return (
        <StewardContext.Provider value={{ profile, isLoadingProfile, refreshProfile: fetchProfile, canAccess }}>
            {children}
        </StewardContext.Provider>
    );
}

export function useSteward() {
    const context = useContext(StewardContext);
    if (context === undefined) throw new Error('useSteward must be used within a StewardProvider');
    return context;
}
