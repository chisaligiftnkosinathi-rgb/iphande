import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { ContinuityDisclosure } from '../components/media/ContinuityDisclosure';
import { DecisionBoundary } from '../components/media/DecisionBoundary';
import { IntentCorrectionFlow } from '../components/media/IntentCorrectionFlow';
import { IntentStudySection } from '../components/media/IntentStudySection';
import { ProvisionalHypothesisSurface } from '../components/media/ProvisionalHypothesisSurface';
import { StewardButton } from '../components/ui/StewardButton';
import { buildApiUrl } from '../src/config/api';
import theme from '../theme';

type MediaAnalysis = {
    media_id: string;
    intent_hypothesis: string;
    business_context_used: boolean;
    confidence_boundary: string;
    context_sources_used: string[];
    context_gaps: string[];
    evidence_boundary: string;
    observations: string[];
    suggested_caption: string;
    suggested_cta: string;
    human_approval_required: boolean;
};

export default function MediaCompanionScreen({ route, navigation }: any) {
    // For UI demonstration, we fallback to a placeholder ID if not provided by navigation
    const { mediaId } = route?.params || { mediaId: 'mock-id' };
    const [analysis, setAnalysis] = useState<MediaAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [correctionMode, setCorrectionMode] = useState(false);
    const [correctionText, setCorrectionText] = useState('');
    const [actionStatus, setActionStatus] = useState<string | null>(null);

    async function fetchAnalysis() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(buildApiUrl(`/media/${mediaId}/analyze`), {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Companion study failed: ${response.status}`);
            }

            const data = await response.json();
            setAnalysis(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown companion error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (mediaId) {
            fetchAnalysis();
        }
    }, [mediaId]);

    async function handleApprove() {
        if (!analysis) return;
        try {
            const response = await fetch(buildApiUrl(`/media/${mediaId}/draft/approve`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent_hypothesis: analysis.intent_hypothesis,
                    approved_caption: analysis.suggested_caption,
                    approved_cta: analysis.suggested_cta,
                }),
            });
            if (response.ok) {
                setActionStatus('You approved this as your intent.');
                setAnalysis(null);
            }
        } catch (err) {
            Alert.alert("Notice", "Unable to finalize approval at this time.");
        }
    }

    async function handleReject() {
        if (!analysis) return;
        try {
            const response = await fetch(buildApiUrl(`/media/${mediaId}/draft/reject`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent_hypothesis: analysis.intent_hypothesis,
                }),
            });
            if (response.ok) {
                setActionStatus('You chose not to use this suggestion.');
                setAnalysis(null);
            }
        } catch (err) {
            Alert.alert("Notice", "Unable to record rejection at this time.");
        }
    }

    async function handleCorrect() {
        if (!analysis || !correctionText.trim()) return;
        try {
            const response = await fetch(buildApiUrl(`/media/${mediaId}/interpretation/correct`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    previous_interpretation_type: analysis.intent_hypothesis,
                    corrected_interpretation_type: correctionText.trim(),
                }),
            });
            if (response.ok) {
                setActionStatus('You corrected the system’s understanding.');
                setAnalysis(null);
                setCorrectionMode(false);
            }
        } catch (err) {
            Alert.alert("Notice", "Unable to record correction at this time.");
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator color="#16a34a" size="large" />
                <Text style={styles.muted}>Observing carefully...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>Unable to observe media context.</Text>
                <Text style={styles.muted}>{error}</Text>
                <StewardButton
                    title="Retry"
                    variant="secondary"
                    onPress={fetchAnalysis}
                    style={{ marginTop: theme.layout.spacing.lg }}
                />
            </SafeAreaView>
        );
    }

    if (actionStatus) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.successTitle}>Intent Sealed</Text>
                <Text style={styles.successText}>{actionStatus}</Text>
                <StewardButton
                    title="Return to Timeline"
                    onPress={() => navigation.goBack()}
                />
            </SafeAreaView>
        );
    }

    if (!analysis) return null;

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Contextual Intent Study</Text>
                <Text style={styles.subtitle}>Provisional understanding of uploaded media.</Text>

                <ContinuityDisclosure />

                <IntentStudySection
                    observations={analysis.observations}
                    contextSourcesUsed={analysis.context_sources_used}
                    contextGaps={analysis.context_gaps}
                />

                <ProvisionalHypothesisSurface
                    intentHypothesis={analysis.intent_hypothesis}
                    suggestedCaption={analysis.suggested_caption}
                    suggestedCta={analysis.suggested_cta}
                />

                <View style={styles.decisionSection}>
                    <Text style={styles.decisionTitle}>Your Decision</Text>
                    <Text style={styles.decisionSubtitle}>
                        You must approve before anything is used.
                    </Text>

                    {!correctionMode ? (
                        <DecisionBoundary
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onCorrect={() => setCorrectionMode(true)}
                        />
                    ) : (
                        <IntentCorrectionFlow
                            correctionText={correctionText}
                            onCorrectionTextChange={setCorrectionText}
                            onSubmit={handleCorrect}
                            onCancel={() => setCorrectionMode(false)}
                        />
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.humanSpace.background,
    },
    scrollContent: {
        padding: theme.layout.spacing.xl,
        paddingBottom: theme.layout.spacing.huge,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.layout.spacing.xxl,
        backgroundColor: theme.colors.humanSpace.background,
    },
    title: {
        ...theme.typography.title,
        color: theme.colors.structural.charcoal,
    },
    subtitle: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
        marginTop: theme.layout.spacing.xs,
        marginBottom: theme.layout.spacing.xxl,
    },
    realityBoundary: {
        backgroundColor: theme.colors.reality.bg,
        borderWidth: 1,
        borderColor: theme.colors.reality.border,
        borderRadius: theme.layout.radii.md,
        padding: theme.layout.spacing.lg,
        marginBottom: theme.layout.spacing.xxl,
    },
    realityBoundaryTitle: {
        ...theme.typography.eyebrow,
        color: theme.colors.reality.text,
        marginBottom: theme.layout.spacing.sm,
    },
    realityBoundaryText: {
        ...theme.typography.body,
        color: theme.colors.reality.textDeep,
        marginBottom: theme.layout.spacing.xs,
    },
    section: {
        marginBottom: theme.layout.spacing.xl,
    },
    sectionGap: {
        marginBottom: theme.layout.spacing.xl,
        backgroundColor: theme.colors.evidence.bg,
        padding: theme.layout.spacing.lg,
        borderRadius: theme.layout.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.evidence.border,
    },
    sectionTitle: {
        ...theme.typography.heading,
        color: theme.colors.structural.charcoalLight,
        marginBottom: theme.layout.spacing.sm,
    },
    sectionTitleSub: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.slate,
        marginTop: theme.layout.spacing.lg,
        marginBottom: theme.layout.spacing.xs,
    },
    listItem: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
        marginBottom: theme.layout.spacing.xs,
    },
    listItemGap: {
        ...theme.typography.body,
        color: theme.colors.evidence.textDeep,
        marginBottom: theme.layout.spacing.xs,
    },
    provisionalBox: {
        backgroundColor: theme.colors.humanSpace.surface,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.md,
        padding: theme.layout.spacing.lg,
        marginBottom: theme.layout.spacing.xxxl,
    },
    hypothesisText: {
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        fontStyle: 'italic',
    },
    provisionalText: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
    },
    decisionSection: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.structural.border,
        paddingTop: theme.layout.spacing.xxl,
    },
    decisionTitle: {
        ...theme.typography.title,
        fontSize: 20,
        color: theme.colors.structural.charcoal,
    },
    decisionSubtitle: {
        ...theme.typography.body,
        color: theme.colors.structural.slateMuted,
        marginTop: theme.layout.spacing.xs,
        marginBottom: theme.layout.spacing.xl,
    },
    buttonPrimary: {
        backgroundColor: theme.colors.stewardship.text,
        borderRadius: theme.layout.radii.sm,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: theme.layout.spacing.md,
    },
    buttonPrimaryText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.humanSpace.surface,
    },
    buttonSecondary: {
        backgroundColor: theme.colors.structural.borderSoft,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.sm,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: theme.layout.spacing.md,
    },
    buttonSecondaryText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.charcoalLight,
    },
    buttonGhost: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonGhostText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.slate,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    correctionBox: {
        backgroundColor: theme.colors.humanSpace.surface,
        padding: theme.layout.spacing.lg,
        borderRadius: theme.layout.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
    },
    input: {
        backgroundColor: theme.colors.humanSpace.background,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.sm,
        padding: theme.layout.spacing.md,
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: theme.layout.spacing.md,
    },
    correctionHelper: {
        ...theme.typography.caption,
        color: theme.colors.structural.slateMuted,
        fontStyle: 'italic',
        marginBottom: theme.layout.spacing.lg,
    },
    row: {
        flexDirection: 'row',
    },
    muted: {
        ...theme.typography.body,
        marginTop: theme.layout.spacing.md,
        color: theme.colors.structural.slateMuted,
    },
    errorText: {
        ...theme.typography.heading,
        color: theme.colors.resolution.textDeep,
    },
    successTitle: {
        ...theme.typography.title,
        color: theme.colors.stewardship.text,
        marginBottom: theme.layout.spacing.sm,
    },
    successText: {
        ...theme.typography.body,
        color: theme.colors.structural.charcoalLight,
        textAlign: 'center',
        marginBottom: theme.layout.spacing.xxl,
    },
});
