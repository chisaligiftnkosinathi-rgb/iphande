import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';

// ─── The Backend Contract ────────────────────────────────────────────────

interface OnboardingCard {
    key: string;
    title: string;
    description: string;
    status: 'complete' | 'next' | 'locked' | 'optional';
    route?: string;
}

interface OnboardingState {
    profile_stage: string;
    completion_percent: number;
    next_best_action: {
        key: string;
        label: string;
        route: string;
    };
    cards: OnboardingCard[];
}

// ─── Mock Fallback (Until Backend is Live) ───────────────────────────────

const MOCK_BACKEND_STATE: OnboardingState = {
    profile_stage: "visible_basic",
    completion_percent: 40,
    next_best_action: {
        key: "contact",
        label: "Add WhatsApp so customers can contact you",
        route: "/onboarding/contact" // Maps to actual app routes
    },
    cards: [
        { key: "identity", title: "Become Visible", description: "Name, category, location", status: "complete" },
        { key: "contact", title: "Let customers reach you", description: "WhatsApp number", status: "next", route: "/onboarding/contact" },
        { key: "services", title: "Show What You Do", description: "Core service, service list", status: "locked" },
        { key: "proof", title: "Build Trust", description: "Proof of work / gallery", status: "locked" },
        { key: "branding", title: "Look Professional", description: "Logo, cover photo", status: "locked" },
        { key: "referral", title: "Invite & Grow", description: "Referral code", status: "locked" }
    ]
};

// ─── The UI Engine ───────────────────────────────────────────────────────

export default function DeterministicOnboardingHub() {
    const router = useRouter();
    const [state, setState] = useState<OnboardingState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadState = async () => {
            try {
                // Attempt to fetch the real backend contract
                const data = await fetchWithAuth('/profiles/me/onboarding-state');
                setState(data);
            } catch (error) {
                console.log("Backend route not ready, using deterministic mock.");
                // Fallback to our deterministic mock if the endpoint 404s
                setState(MOCK_BACKEND_STATE);
            } finally {
                setLoading(false);
            }
        };

        loadState();
    }, []);

    if (loading || !state) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#111827" />
                <Text style={styles.loadingText}>Syncing with iPhande...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* ── Header & Progress ── */}
            <View style={styles.header}>
                <Text style={styles.kicker}>Setup Guide</Text>
                <Text style={styles.title}>Your Profile Strength</Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${state.completion_percent}%` }]} />
                </View>
                <Text style={styles.progressText}>{state.completion_percent}% Completed</Text>
            </View>

            {/* ── Next Best Action (Directed by Backend) ── */}
            <View style={styles.nextActionCard}>
                <View style={styles.nextActionHeader}>
                    <Ionicons name="flash" size={20} color="#F59E0B" />
                    <Text style={styles.nextActionLabel}>NEXT BEST ACTION</Text>
                </View>
                <Text style={styles.nextActionTitle}>{state.next_best_action.label}</Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => state.next_best_action.route ? router.push(state.next_best_action.route as any) : null}
                >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* ── The Domino Cards (Rendered deterministically) ── */}
            <Text style={styles.sectionTitle}>Your Journey</Text>

            <View style={styles.cardList}>
                {state.cards.map((card, index) => {
                    const isComplete = card.status === 'complete';
                    const isNext = card.status === 'next';
                    const isLocked = card.status === 'locked';

                    return (
                        <TouchableOpacity
                            key={card.key}
                            style={[
                                styles.taskCard,
                                isNext && styles.taskCardActive,
                                isLocked && styles.taskCardLocked
                            ]}
                            disabled={isLocked || isComplete}
                            onPress={() => card.route ? router.push(card.route as any) : null}
                        >
                            <View style={styles.taskIconContainer}>
                                {isComplete && <Ionicons name="checkmark-circle" size={28} color="#10B981" />}
                                {isNext && <Ionicons name="radio-button-off" size={28} color="#3B82F6" />}
                                {isLocked && <Ionicons name="lock-closed" size={24} color="#9CA3AF" />}
                            </View>

                            <View style={styles.taskContent}>
                                <Text style={[
                                    styles.taskTitle,
                                    isComplete && styles.textComplete,
                                    isLocked && styles.textLocked
                                ]}>{card.title}</Text>
                                <Text style={[styles.taskDescription, isLocked && styles.textLocked]}>
                                    {card.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { padding: 24, paddingBottom: 60 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280', fontWeight: '600' },

    header: { marginBottom: 32, marginTop: 16 },
    kicker: { fontSize: 13, fontWeight: '800', color: '#10B981', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 24 },

    progressContainer: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
    progressBar: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
    progressText: { fontSize: 14, fontWeight: '700', color: '#4B5563', textAlign: 'right' },

    nextActionCard: { backgroundColor: '#111827', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    nextActionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    nextActionLabel: { color: '#F59E0B', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    nextActionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 28, marginBottom: 24 },

    primaryButton: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },

    cardList: { gap: 12 },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1
    },
    taskCardActive: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
    },
    taskCardLocked: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    taskIconContainer: { width: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    taskContent: { flex: 1 },
    taskTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    taskDescription: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

    textComplete: { color: '#10B981', textDecorationLine: 'line-through' },
    textLocked: { color: '#9CA3AF' },
});
