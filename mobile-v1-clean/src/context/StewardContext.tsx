import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { bootstrapProfile, getMe } from '../services/stewardApi';
import { StewardProfile } from '../types/steward';
import { useAuth } from './AuthContext';

interface StewardContextType {
    profile: StewardProfile | null;
    isLoadingProfile: boolean;
    refreshProfile: () => Promise<void>;
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
            setProfile(fetchedProfile);
        } catch (error) {
            console.warn('Profile fetch failed. Trying bootstrap...', error);

            try {
                if (!session?.access_token) throw new Error('No Supabase token available for bootstrap');

                const bootstrappedProfile = await bootstrapProfile();
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

    return (
        <StewardContext.Provider value={{ profile, isLoadingProfile, refreshProfile: fetchProfile }}>
            {children}
        </StewardContext.Provider>
    );
}

export function useSteward() {
    const context = useContext(StewardContext);
    if (context === undefined) throw new Error('useSteward must be used within a StewardProvider');
    return context;
}
