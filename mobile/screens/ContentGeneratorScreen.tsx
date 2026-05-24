import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { generateContentPost } from '../src/services/apiClient';
import { DEMO_BUSINESS_OWNER_ID } from '../src/config/demoIdentity';
import type { ContentGenerationResult } from '../src/types/api';
import type { RootTabParamList } from '../navigation';

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
    const [input, setInput] = useState('');
    const [result, setResult] = useState<ContentGenerationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Example payload, adapt as needed for your UI
            const payload = {
                business_owner_id: DEMO_BUSINESS_OWNER_ID,
                business_category_key: 'commission_based_sales',
                business_line: 'Funeral Cover Agent',
                goal_key: 'request_quotes',
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
                        style={[styles.primaryButton, { backgroundColor: '#14532D' }]}
                        onPress={() => {
                            // @ts-ignore
                            navigation.navigate('QuoteRequestForm', DEMO_QUOTE_PARAMS);
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
                        <Pressable
                            style={styles.replayButton}
                            onPress={() => navigation.navigate('EntityReplay', {
                                entityId: result.content_post_id!,
                                entityType: 'content_post',
                            })}
                        >
                            <Text style={styles.replayButtonText}>Inspect replay lineage</Text>
                        </Pressable>
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
        backgroundColor: '#F8FAF7',
    },
    content: {
        padding: 20,
        gap: 16,
    },
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#102A20',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3E6B57',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#102A20',
        letterSpacing: -1.5,
        marginBottom: 8,
    },
    description: {
        fontSize: 17,
        lineHeight: 30,
        color: '#4B5563',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#111827',
        marginBottom: 12,
    },
    generatorCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#102A20',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#111827',
        minHeight: 120,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#1E3A2F',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#1E3A2F',
        fontWeight: '700',
        fontSize: 14,
    },
    samplesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sampleItem: {
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
    },
    sampleType: {
        fontSize: 13,
        fontWeight: '800',
        color: '#2F6B4F',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    sampleContent: {
        fontSize: 14,
        lineHeight: 22,
        color: '#4B5563',
    },
    replayButton: {
        backgroundColor: '#111827',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    replayButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },
    boundaryCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#991B1B',
        marginBottom: 8,
    },
    boundaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#B91C1C',
    },
});

export default ContentGeneratorScreen;
