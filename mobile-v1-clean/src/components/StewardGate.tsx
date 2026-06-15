import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSteward } from '../context/StewardContext';

/**
 * R120 Verification Gate.
 * Blocks access to Opportunities, Leads, Visibility, and premium tools until the R120 setup fee is approved.
 */
const PUBLIC_BENEFIT_TABS = ['index', 'leads', 'visibility'];
const PREMIUM_TOOLS = ['calculator', 'quotes', 'invoices', 'proof-of-work'];

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
        const inPaymentVerification = segmentsArray[0] === 'payment-verification';
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

        const isAdmin = profile.role === 'admin' || profile.role === 'system_admin' || profile.platform_identity === 'SYSTEM_CREATOR' || profile.platform_identity === 'SYSTEM_ADMIN';
        const isSetupFeeApproved = isAdmin || (profile.setup_fee_status === "approved" && profile.is_verified === true);

        const onboardingComplete =
            profile.onboarding_completed === true ||
            profile.onboardingComplete === true; // legacy fallback

        // 3. Profile exists, but onboarding is not complete
        if (!onboardingComplete) {
            if (!inOnboarding) router.replace('/onboarding');
            return;
        }

        // 4. Onboarded, but setup fee not approved → route appropriately
        if (!isSetupFeeApproved) {
            // Note: Premium tools are now gated at the component level using FeatureLockedCard.
            // If they are on old activation screen, send them to payment verification
            if (inActivation) {
                router.replace('/payment-verification');
                return;
            }
            // If they're on auth/root, send them to home
            if (inAuthGroup || isRoot) {
                router.replace('/tabs/home');
                return;
            }
            return;
        }

        // 5. Fully Activated and Onboarded
        // Keep them OUT of Auth, Welcome, old Activation, and Payment Verification
        if (inAuthGroup || isRoot || inActivation || inPaymentVerification) {
            router.replace('/tabs/home');
        }

    }, [user, isAuthLoading, profile, isLoadingProfile, segments]);

    // Let the layout render the actual UI
    return <>{children}</>;
}
