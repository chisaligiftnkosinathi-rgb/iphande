import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string): Promise<void> => {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error('Supabase Login Error:', error);
            throw error;
        }
        console.log("SIGN IN: session established, user:", data.session?.user?.id);
    };

    const signUp = async (email: string, password: string): Promise<void> => {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            console.error('Supabase Sign Up Error:', error);
            throw error;
        }

        console.log('SUPABASE SIGNUP USER:', data.user?.id);
        console.log('SUPABASE SESSION EXISTS:', !!data.session);
    };

    const resendVerificationEmail = async (email: string): Promise<void> => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });

        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, resendVerificationEmail }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
