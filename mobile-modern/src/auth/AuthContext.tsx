import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    reload,
    sendEmailVerification,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';

interface AuthContextType {
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
    user: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [selectedBusinessArchetypeKey, setSelectedBusinessArchetypeKey] = useState<string | null>(null);
    const [stewardName, setStewardName] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            // Reset onboarding state if user changes
            setIsOnboarded(false);
            setProfileId(null);
            setSelectedBusinessArchetypeKey(null);
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
    }, []);

    const completeOnboarding = (profileId: string, archetypeKey: string, stewardName: string) => {
        setProfileId(profileId);
        setSelectedBusinessArchetypeKey(archetypeKey);
        setStewardName(stewardName);
        setIsOnboarded(true);
    };

    const refreshUser = useCallback(async () => {
        if (auth.currentUser) {
            await reload(auth.currentUser);
            setUser(auth.currentUser);
        }
    }, []);

    const isAuthenticated = !!user;
    const stewardId = user?.uid || null;
    const emailVerified = !!user?.emailVerified;

    return (
        <AuthContext.Provider
            value={{
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
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};
