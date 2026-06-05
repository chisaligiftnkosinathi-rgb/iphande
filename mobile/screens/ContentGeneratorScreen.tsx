import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import type { RootTabParamList } from '../navigation';
import { useAuth } from '../src/auth/AuthContext';
import { useStewardMedia } from '../src/features/steward-media/StewardMediaContext';
import { fetchProfileByOwner, generateContentPost } from '../src/services/apiClient';
import type { ContentGenerationResult, Profile } from '../src/types/api';
import theme from '../theme';

type ContentGeneratorNavigation = {
    navigate: <Name extends keyof RootTabParamList>(
        name: Name,
        params?: RootTabParamList[Name]
    ) => void;
};

const generatedSamples = [
    {
        id: 1,
        type: 'Social Post',
        content:
            'Empowering local entrepreneurs through community-driven opportunities.',
    },
    {
        id: 2,
        type: 'Campaign Message',
        content:
            'Join us in building sustainable business growth within our communities.',
    },
];

const DEMO_QUOTE_PARAMS = {
    business_owner_id: 'demo-owner-1',
    business_category_key: 'commission_based_sales',
    business_line: 'Funeral Cover Agent',
    post_id: 'demo-post-1',
    business_name: 'Funeral Cover Agent',
    business_subtitle: 'Helping families prepare with dignity.',
};


const ContentGeneratorScreen: React.FC = () => {
    const navigation = useNavigation<ContentGeneratorNavigation>();
    const { draft } = useStewardMedia();
    const { stewardId } = useAuth() as any;
    const [input, setInput] = useState('');
    const [result, setResult] = useState<ContentGenerationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Hydrate form state from steward media draft (read-only, only on mount)
    useEffect(() => {
        if (draft && draft.offer_details && !input) {
            setInput(draft.offer_details);
        }
    }, [draft]);

    useEffect(() => {
        if (stewardId) {
            fetchProfileByOwner(stewardId).then(setProfile).catch(() => { });
        }
    }, [stewardId]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Example payload, adapt as needed for your UI
            const payload = {
                business_owner_id: stewardId,
                business_category_key: profile?.business_category_key || 'general_business',
                business_line: profile?.business_line || 'Services',
                goal_key: 'promote_today',
                platform: 'facebook',
                offer_details: input.trim(),
            };
            const res = await generateContentPost(payload);
            setResult(res);
        } catch (err: any) {
            setError(err.message || 'Failed to generate content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>AI Assisted Writing</Text>

                <Text style={styles.title}>Content Generator</Text>

                <Text style={styles.description}>
                    Generate professional campaign messages, business posts, outreach communication, and promotional content.
                </Text>
            </View>

            <View style={styles.generatorCard}>
                <Text style={styles.sectionTitle}>Generate Content</Text>

                <TextInput
                    placeholder="What would you like to generate?"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                />

                <View style={styles.buttonRow}>
                    <Pressable style={styles.primaryButton} onPress={handleGenerate} disabled={loading}>
                        <Text style={styles.primaryButtonText}>
                            {loading ? 'Generating...' : 'Generate'}
                        </Text>
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={() => setResult(null)}>
                        <Text style={styles.secondaryButtonText}>Clear</Text>
                    </Pressable>
                </View>

                {/* Request Quote Button */}
                <View style={{ marginTop: 18 }}>
                    <Pressable
                        style={[styles.primaryButton, { backgroundColor: theme.colors.stewardship.textDeep }]}
                        onPress={() => {
                            // @ts-ignore
                            navigation.navigate('QuoteRequestForm', {
                                business_owner_id: stewardId,
                                business_category_key: profile?.business_category_key || 'general_business',
                                business_line: profile?.business_line || 'Services',
                                post_id: result?.content_post_id || 'generated-post',
                                business_name: profile?.name || 'My Business',
                                business_subtitle: (profile as any)?.short_bio || profile?.bio || '',
                            });
                        }}
                    >
                        <Text style={styles.primaryButtonText}>Request Quote</Text>
                    </Pressable>
                </View>
            </View>

            {result && (
                <View style={styles.samplesCard}>
                    <Text style={styles.sectionTitle}>Generated Caption</Text>
                    <Text style={styles.sampleContent}>{result.caption}</Text>

                    {result.content_post_id && (
                        <>
                            <Pressable
                                style={[styles.primaryButton, { flex: undefined, marginTop: 16, backgroundColor: theme.colors.stewardship.textDeep }]}
                                onPress={() => navigation.navigate('LeadQuoteCapture', { postId: result.content_post_id })}
                            >
                                <Text style={styles.primaryButtonText}>Capture Lead from this Post</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.replayButton, { marginTop: 12 }]}
                                onPress={() => navigation.navigate('EntityReplay', {
                                    entityId: result.content_post_id!,
                                    entityType: 'content_post',
                                })}
                            >
                                <Text style={styles.replayButtonText}>Inspect replay lineage</Text>
                            </Pressable>
                        </>
                    )}

                    <Text style={styles.sectionTitle}>CTA</Text>
                    <Text style={styles.sampleContent}>{result.default_cta}</Text>

                    <Text style={styles.sectionTitle}>Hashtags</Text>
                    <Text style={styles.sampleContent}>
                        {Array.isArray(result.hashtags) ? result.hashtags.join(' ') : result.hashtags}
                    </Text>

                    <Text style={styles.sectionTitle}>Governance Status</Text>
                    <Text style={styles.sampleContent}>
                        {result.guardrails_passed ? '✅ Passed' : '❌ Violations'}
                    </Text>
                    {!result.guardrails_passed && result.guardrail_violations.length > 0 && (
                        <Text style={styles.sampleContent}>
                            Violations: {result.guardrail_violations.join(', ')}
                        </Text>
                    )}

                    <Text style={styles.sectionTitle}>Replay Events</Text>
                    <Text style={styles.sampleContent}>Event Count: {result.event_count}</Text>
                    {result.events && result.events.length > 0 && result.events.map((ev, idx) => (
                        <View key={idx} style={{ marginBottom: 8 }}>
                            <Text style={{ fontWeight: 'bold' }}>{ev.event_type}</Text>
                            <Text selectable style={{ fontSize: 12 }}>
                                {JSON.stringify(ev.payload, null, 2)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.boundaryCard}>
                <Text style={styles.boundaryTitle}>
                    Content responsibility
                </Text>

                <Text style={styles.boundaryText}>
                    Generated content should remain truthful, context-aware, and clearly attributable to the originating campaign or business activity.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.humanSpace.background,
    },
    content: {
        padding: theme.layout.spacing.xl,
        gap: theme.layout.spacing.lg,
    },
    heroCard: {
        ...theme.layout.cards.base,
    },
    eyebrow: {
        ...theme.typography.eyebrow,
        color: theme.colors.stewardship.textDeep,
        marginBottom: theme.layout.spacing.sm,
    },
    title: {
        ...theme.typography.display,
        color: theme.colors.structural.charcoal,
        marginBottom: theme.layout.spacing.sm,
    },
    description: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
    },
    input: {
        backgroundColor: theme.colors.humanSpace.background,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.md,
        paddingHorizontal: theme.layout.spacing.lg,
        paddingVertical: 14,
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        marginBottom: theme.layout.spacing.md,
    },
    generatorCard: {
        ...theme.layout.cards.base,
    },
    sectionTitle: {
        ...theme.typography.title,
        fontSize: 20,
        color: theme.colors.structural.charcoal,
        marginBottom: theme.layout.spacing.lg,
    },
    textArea: {
        backgroundColor: theme.colors.humanSpace.background,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.md,
        paddingHorizontal: theme.layout.spacing.lg,
        paddingVertical: 14,
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        minHeight: 120,
        marginBottom: theme.layout.spacing.lg,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.layout.spacing.md,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: theme.colors.structural.charcoalLight,
        borderRadius: theme.layout.radii.md,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.humanSpace.surface,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: theme.colors.humanSpace.surface,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.md,
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.charcoalLight,
    },
    samplesCard: {
        ...theme.layout.cards.base,
    },
    sampleItem: {
        backgroundColor: theme.colors.humanSpace.background,
        borderRadius: theme.layout.radii.md,
        padding: theme.layout.spacing.lg,
        marginBottom: theme.layout.spacing.md,
    },
    sampleType: {
        ...theme.typography.eyebrow,
        color: theme.colors.stewardship.textDeep,
        marginBottom: theme.layout.spacing.sm,
    },
    sampleContent: {
        ...theme.typography.body,
        color: theme.colors.structural.slate,
    },
    replayButton: {
        backgroundColor: theme.colors.structural.charcoal,
        borderRadius: theme.layout.radii.md,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: theme.layout.spacing.lg,
        marginBottom: theme.layout.spacing.xl,
    },
    replayButtonText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.humanSpace.surface,
    },
    boundaryCard: {
        backgroundColor: theme.colors.resolution.bg,
        borderRadius: theme.layout.radii.lg,
        padding: theme.layout.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.resolution.border,
    },
    boundaryTitle: {
        ...theme.typography.heading,
        color: theme.colors.resolution.textDeep,
        marginBottom: theme.layout.spacing.sm,
    },
    boundaryText: {
        ...theme.typography.body,
        color: theme.colors.resolution.textDeep,
    },
});

export default ContentGeneratorScreen;
