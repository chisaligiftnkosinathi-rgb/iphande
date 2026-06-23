import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { ContinuityMeta } from '../components/ui/ContinuityMeta';
import { RealityBoundary } from '../components/ui/RealityBoundary';
import { StewardButton } from '../components/ui/StewardButton';
import { TruthCard } from '../components/ui/TruthCard';
import { WisdomCard } from '../components/ui/WisdomCard';
import { buildApiUrl } from '../src/config/api';
import theme from '../theme';

const DEMO_BUSINESS_OWNER_ID = "BO002";

type TimelineEvent = {
    id: string;
    event_type: string;
    created_at: string;
    lineage_sequence: number;
    human_readable_label: string;
    epistemic_boundary?: string;
    payload_summary?: Record<string, any>;
};

export default function StewardTimelineScreen() {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [annotations, setAnnotations] = useState<any[]>([]);
    const [newWisdomBody, setNewWisdomBody] = useState("");
    const [submittingWisdomId, setSubmittingWisdomId] = useState<string | null>(null);

    async function fetchTimeline() {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                buildApiUrl(`/steward-timeline/${DEMO_BUSINESS_OWNER_ID}`)
            );

            if (!response.ok) {
                throw new Error(`Timeline request failed: ${response.status}`);
            }

            const data = await response.json();

            const orderedEvents = [...(Array.isArray(data) ? data : [])].sort(
                (a, b) => a.lineage_sequence - b.lineage_sequence
            );

            setEvents(orderedEvents);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown timeline error");
        } finally {
            setLoading(false);
        }
    }

    async function fetchAnnotationsForEvent(eventId: string) {
        setSelectedEventId(eventId);

        const response = await fetch(
            buildApiUrl(`/steward-annotations/event/${eventId}`)
        );

        if (!response.ok) {
            setAnnotations([]);
            return;
        }

        const data = await response.json();
        setAnnotations(Array.isArray(data) ? data : []);
    }

    async function submitWisdom(eventId: string) {
        if (!newWisdomBody.trim()) return;

        try {
            setSubmittingWisdomId(eventId);

            const response = await fetch(buildApiUrl('/steward-annotations'), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    target_event_id: eventId,
                    steward_id: DEMO_BUSINESS_OWNER_ID,
                    annotation_type: "context",
                    body: newWisdomBody.trim(),
                    visibility: "bounded",
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to append wisdom: ${response.status}`);
            }

            setNewWisdomBody("");
            await fetchAnnotationsForEvent(eventId);
            await fetchTimeline(); // Refresh timeline to show the new annotation metadata event
        } catch (err) {
            console.error("Wisdom submission failed:", err);
        } finally {
            setSubmittingWisdomId(null);
        }
    }

    useEffect(() => {
        fetchTimeline();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Reading the continuity river...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.error}>Unable to load steward timeline.</Text>
                <Text style={styles.muted}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen}>
            <Text style={styles.title}>Steward Timeline</Text>
            <Text style={styles.subtitle}>
                Observe. Trace. Understand. This surface is read-only.
            </Text>

            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TruthCard>
                        <Text style={styles.label}>{item.human_readable_label}</Text>

                        <View style={styles.metaBox}>
                            <ContinuityMeta label="Sequence" value={`#${item.lineage_sequence}`} />
                            <ContinuityMeta label="Event" value={item.event_type} />
                            <ContinuityMeta label="Created" value={new Date(item.created_at).toLocaleString()} />
                        </View>

                        {item.epistemic_boundary ? (
                            <RealityBoundary title="Epistemic Boundary" style={styles.spacingTop}>
                                {item.epistemic_boundary}
                            </RealityBoundary>
                        ) : null}

                        {item.payload_summary && item.payload_summary.summary_available !== false ? (
                            <Text style={styles.summary}>
                                {JSON.stringify(item.payload_summary, null, 2)}
                            </Text>
                        ) : null}

                        <StewardButton
                            title="Read steward wisdom"
                            variant="secondary"
                            onPress={() => fetchAnnotationsForEvent(item.id)}
                            style={styles.spacingTop}
                        />

                        {selectedEventId === item.id && annotations.length > 0 ? (
                            <View style={styles.annotationBox}>
                                {annotations.map((annotation) => (
                                    <WisdomCard key={annotation.id} annotation={annotation} style={styles.spacingTopSmall} />
                                ))}
                            </View>
                        ) : null}

                        {selectedEventId === item.id && annotations.length === 0 ? (
                            <Text style={styles.noAnnotations}>
                                No steward wisdom added for this event yet.
                            </Text>
                        ) : null}

                        {selectedEventId === item.id ? (
                            <View style={styles.addWisdomBox}>
                                <TextInput
                                    style={styles.wisdomInput}
                                    placeholder="Append steward wisdom..."
                                    placeholderTextColor={theme.colors.structural.slateMuted}
                                    multiline
                                    value={newWisdomBody}
                                    onChangeText={setNewWisdomBody}
                                    editable={submittingWisdomId !== item.id}
                                />
                                <StewardButton
                                    title={submittingWisdomId === item.id ? "Appending..." : "Append wisdom"}
                                    onPress={() => submitWisdom(item.id)}
                                    disabled={!newWisdomBody.trim() || submittingWisdomId === item.id}
                                    loading={submittingWisdomId === item.id}
                                />
                            </View>
                        ) : null}
                    </TruthCard>
                )}
                ListEmptyComponent={
                    <Text style={styles.muted}>No continuity events found.</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    spacingTop: {
        marginTop: theme.layout.spacing.lg,
    },
    spacingTopSmall: {
        marginTop: theme.layout.spacing.sm,
    },
    screen: {
        flex: 1,
        backgroundColor: theme.colors.humanSpace.background,
        padding: theme.layout.spacing.lg,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
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
    },
    list: {
        paddingTop: theme.layout.spacing.lg,
        paddingBottom: theme.layout.spacing.xxxl,
    },
    label: {
        ...theme.typography.heading,
        color: theme.colors.structural.charcoal,
        marginTop: theme.layout.spacing.xs,
    },
    metaBox: {
        marginTop: theme.layout.spacing.sm,
        marginBottom: theme.layout.spacing.sm,
    },
    summary: {
        ...theme.typography.body,
        color: theme.colors.structural.charcoalLight,
        marginTop: theme.layout.spacing.md,
    },
    muted: {
        ...theme.typography.body,
        color: theme.colors.structural.slateMuted,
        marginTop: theme.layout.spacing.sm,
        textAlign: "center",
    },
    annotationBox: {
        marginTop: theme.layout.spacing.md,
    },
    noAnnotations: {
        ...theme.typography.caption,
        color: theme.colors.structural.slateMuted,
        marginTop: theme.layout.spacing.sm,
        fontStyle: "italic",
    },
    addWisdomBox: {
        marginTop: theme.layout.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.structural.border,
        paddingTop: theme.layout.spacing.md,
    },
    wisdomInput: {
        backgroundColor: theme.colors.humanSpace.background,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.sm,
        padding: theme.layout.spacing.md,
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        minHeight: 60,
        textAlignVertical: "top",
    },
    submitWisdomButton: {
        alignSelf: "flex-end",
        marginTop: theme.layout.spacing.sm,
    },
    submitWisdomText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.stewardship.text,
    },
    disabledText: {
        color: theme.colors.structural.slateMuted,
    },
    error: {
        ...theme.typography.heading,
        color: theme.colors.resolution.textDeep,
    },
});
