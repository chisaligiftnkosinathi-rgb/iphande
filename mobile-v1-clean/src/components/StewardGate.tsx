import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSteward } from '../context/StewardContext';

export function StewardGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { profile, isLoadingProfile } = useSteward();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isAuthLoading || isLoadingProfile) return;

        const segmentsArray = segments as string[];
        const inAuthGroup = segmentsArray[0] === 'auth';
        const isRoot = segmentsArray.length === 0 || segmentsArray[0] === 'index';
        const inActivation = segmentsArray[0] === 'activation';
        const inOnboarding = segmentsArray[0] === 'onboarding';
        const inPublic = segmentsArray[0] === 'public';

        // 1. Logged out -> Must be in Auth, Welcome, or Public
        if (!user) {
            if (!inAuthGroup && !isRoot && !inPublic) {
                router.replace('/auth/login');
            }
            return;
        }

        // 2. Logged in, but NO profile exists yet -> Needs to hit the activation wall while bootstrapping
        if (!profile) {
            if (!inActivation) router.replace('/activation');
            return;
        }

        const isSetupFeeApproved =
            profile.setup_fee_status === "approved" ||
            profile.setup_fee_status === "paid" ||
            profile.setup_fee_status === "waived";

        const onboardingComplete =
            profile.onboarding_completed === true ||
            profile.onboardingComplete === true; // legacy fallback

        // 3. Profile exists, but onboarding is not complete
        if (!onboardingComplete) {
            if (!inOnboarding) router.replace('/onboarding');
            return;
        }

        // 4. Onboarded, but setup fee not approved
        if (!isSetupFeeApproved) {
            if (!inActivation) router.replace('/activation');
            return;
        }

        // 5. Fully Activated and Onboarded
        // Keep them OUT of Auth, Welcome, and Activation (but allow Onboarding for profile editing)
        if (inAuthGroup || isRoot || inActivation) {
            router.replace('/tabs/home');
        }

    }, [user, isAuthLoading, profile, isLoadingProfile, segments]);

    // Let the layout render the actual UI
    return <>{children}</>;
}
