import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    reload,
    sendEmailVerification,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { buildApiUrl } from '../config/api';
import { auth } from '../config/firebase';

type Steward = {
    profileId: string;
    slug: string;
    displayName: string;
    whatsappNumber: string;
    setup_fee_status?: string;
};

interface StewardContextValue {
    // Modern Identity Layer
    steward: Steward | null;

    // Legacy Auth Layer
    isAuthenticated: boolean;
    stewardId: string | null;
    profileId: string | null;
    selectedBusinessArchetypeKey: string | null;
    isOnboarded: boolean;
    emailVerified: boolean;
    stewardName: string | null;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    completeOnboarding: (profileId: string, archetypeKey: string, stewardName: string) => void;
    refreshUser: () => Promise<void>;
    user: User | null;
}

const StewardContext = createContext<StewardContextValue | null>(null);

export function StewardProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [selectedBusinessArchetypeKey, setSelectedBusinessArchetypeKey] = useState<string | null>(null);
    const [stewardName, setStewardName] = useState<string | null>(null);
    const [steward, setSteward] = useState<Steward | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            // Reset onboarding state if user changes
            setIsOnboarded(false);
            setProfileId(null);
            setSelectedBusinessArchetypeKey(null);
            setStewardName(null);
            setSteward(null);

            if (firebaseUser) {
                (async () => {
                    try {
                        // Verify if the Firebase user already owns a Railway profile
                        const response = await fetch(buildApiUrl(`profiles/by-owner/${firebaseUser.uid}`));
                        if (response.ok) {
                            const data = await response.json();
                            setProfileId(data.id);
                            setIsOnboarded(true);
                            setSteward({
                                profileId: data.id,
                                slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || '',
                                displayName: data.name || '',
                                whatsappNumber: data.whatsapp_number || '',
                                setup_fee_status: data.setup_fee_status || '',
                            });
                        }
                    } catch (e) {
                        console.warn("No existing profile found for this owner.", e);
                    }
                })();
            }
        });
        return unsubscribe;
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        setUser(cred.user);
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setUser(cred.user);
    }, []);

    const signOut = useCallback(async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setIsOnboarded(false);
        setProfileId(null);
        setSelectedBusinessArchetypeKey(null);
        setStewardName(null);
        setSteward(null);
    }, []);

    const completeOnboarding = useCallback((newProfileId: string, archetypeKey: string, newStewardName: string) => {
        setProfileId(newProfileId);
        setSelectedBusinessArchetypeKey(archetypeKey);
        setStewardName(newStewardName);
        setIsOnboarded(true);

        // Populate modern steward object
        setSteward({
            profileId: newProfileId,
            slug: newStewardName.toLowerCase().replace(/\s+/g, '-'),
            displayName: newStewardName,
            whatsappNumber: '',
            setup_fee_status: 'pending_review',
        });
    }, []);

    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            await reload(auth.currentUser);
            // Clone the object to force React to detect the state change after reload
            setUser({ ...auth.currentUser } as User);
        }
    }, []);

    const stewardId = user?.uid || null;
    const emailVerified = !!user?.emailVerified;

    // V1 Doctrine: Private stewardship requires a verified identity
    const isAuthenticated = !!user && emailVerified;

    return (
        <StewardContext.Provider
            value={{
                steward,
                isAuthenticated,
                stewardId,
                profileId,
                selectedBusinessArchetypeKey,
                isOnboarded,
                emailVerified,
                stewardName,
                signUp,
                signIn,
                signOut,
                completeOnboarding,
                refreshUser,
                user,
            }}
        >
            {children}
        </StewardContext.Provider>
    );
}

export function useSteward() {
    const context = useContext(StewardContext);

    if (!context) {
        throw new Error('useSteward must be used inside StewardProvider');
    }

    return context;
}
