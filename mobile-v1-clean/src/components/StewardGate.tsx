import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSteward } from '../context/StewardContext';

/**
 * Activation blocks ONLY public verified benefits (Opportunities, Leads, Visibility).
 * Private system tools (Home, Profile, Timeline, tools, expenses) are always accessible.
 */
const PUBLIC_BENEFIT_TABS = ['index', 'leads', 'visibility'];

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
        const inTabs = segmentsArray[0] === 'tabs';

        // 1. Logged out → Must be in Auth, Welcome, or Public
        if (!user) {
            if (!inAuthGroup && !isRoot && !inPublic) {
                router.replace('/auth/login');
            }
            return;
        }

        // 2. Logged in, but NO profile exists yet → show loading (StewardContext handles bootstrap)
        //    If bootstrap also failed, let them into the app anyway (home) rather than blocking
        if (!profile) {
            // Don't block — the backend now auto-bootstraps. Just wait for loading to finish.
            // If truly stuck (profile is null after loading), send to home rather than activation.
            if (!inActivation && !inAuthGroup && !isRoot) return; // let them stay where they are
            if (inAuthGroup || isRoot) router.replace('/tabs/home');
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

        // 4. Onboarded, but setup fee not approved → block ONLY public benefit tabs
        if (!isSetupFeeApproved) {
            // If they're trying to access a public-benefit tab, redirect to activation
            if (inTabs && PUBLIC_BENEFIT_TABS.includes(segmentsArray[1])) {
                router.replace('/activation');
                return;
            }
            // If they're on auth/root, send them to home (not activation)
            if (inAuthGroup || isRoot) {
                router.replace('/tabs/home');
                return;
            }
            // Otherwise let them stay (home, profile, timeline, tools, expenses, activation)
            return;
        }

        // 5. Fully Activated and Onboarded
        // Keep them OUT of Auth, Welcome, and Activation
        if (inAuthGroup || isRoot || inActivation) {
            router.replace('/tabs/home');
        }

    }, [user, isAuthLoading, profile, isLoadingProfile, segments]);

    // Let the layout render the actual UI
    return <>{children}</>;
}
