import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootTabParamList } from '../navigation';
import { getContinuityEvent, getContinuityEventGraph, listContinuityEventChildren } from '../src/services/apiClient';
import { ContinuityEvent } from '../src/types/replay';

type Props = BottomTabScreenProps<RootTabParamList, 'ReplayEventDetail'>;

export const ReplayEventDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { eventId } = route.params;
    const [event, setEvent] = useState<ContinuityEvent | null>(null);
    const [childEvents, setChildEvents] = useState<ContinuityEvent[]>([]);
    const [graphSummary, setGraphSummary] = useState<{ nodeCount: number; edgeCount: number; truncated: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        loadEventDetails();
    }, [eventId]);

    const loadEventDetails = async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const replayEvent = await getContinuityEvent(eventId);
            setEvent(replayEvent);

            try {
                const children = await listContinuityEventChildren(eventId);
                setChildEvents(children);
            } catch (err) {
                console.log('Downstream fetch unavailable or empty for this lineage node.');
            }

            try {
                const graph = await getContinuityEventGraph(eventId, 'both', 5);
                setGraphSummary({
                    nodeCount: graph.nodes.length,
                    edgeCount: graph.edges.length,
                    truncated: graph.truncated,
                });
            } catch (err) {
                console.log('Graph fetch unavailable for this lineage node.');
            }
        } catch (error) {
            console.error('Failed to load event details', error);
            setErrorMessage('Event detail could not be loaded from the configured API.');
            setEvent(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{errorMessage || 'Event not found or no longer accessible in lineage.'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadEventDetails}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const occurredAt = new Date(event.created_at).toLocaleString();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerBox}>
                <Text style={styles.eventType}>{event.event_type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.timestamp}>{occurredAt}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>LINEAGE METADATA</Text>
                <View style={styles.metaGrid}>
                    <Text style={styles.metaLabel}>Event ID:</Text>
                    <Text style={styles.metaValue}>{event.id}</Text>

                    <Text style={styles.metaLabel}>Actor Type:</Text>
                    <Text style={styles.metaValue}>{event.actor_type.toUpperCase()}</Text>

                    <Text style={styles.metaLabel}>Actor ID:</Text>
                    <Text style={styles.metaValue}>{event.actor_id || 'SYSTEM'}</Text>

                    <Text style={styles.metaLabel}>Parent ID:</Text>
                    {event.parent_event_id ? (
                        <TouchableOpacity onPress={() => navigation.navigate('ReplayEventDetail', { eventId: event.parent_event_id! })}>
                            <Text style={styles.linkText}>{event.parent_event_id}</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.metaValue}>NONE</Text>
                    )}

                    <Text style={styles.metaLabel}>Sequence:</Text>
                    <Text style={styles.metaValue}>{event.lineage_sequence ?? 'N/A'}</Text>
                </View>
            </View>

            {event.related_entity_id && event.related_entity_type && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ENTITY REFERENCE</Text>
                    <TouchableOpacity
                        style={styles.entityButton}
                        onPress={() => navigation.navigate('EntityReplay', {
                            entityId: event.related_entity_id!,
                            entityType: event.related_entity_type!
                        })}
                    >
                        <Text style={styles.entityButtonText}>
                            Inspect {event.related_entity_type.toUpperCase()} Timeline
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>DOWNSTREAM CAUSALITY</Text>
                {childEvents.length > 0 ? (
                    childEvents.map((child) => (
                        <View key={child.id} style={styles.causalityRow}>
                            <View style={styles.causalityNode} />
                            <TouchableOpacity
                                style={styles.childEventCard}
                                onPress={() => navigation.navigate('ReplayEventDetail', { eventId: child.id })}
                            >
                                <Text style={styles.childEventType}>{child.event_type.replace(/_/g, ' ').toUpperCase()}</Text>
                                <Text style={styles.childEventActor}>Actor: {child.actor_type.toUpperCase()}</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <Text style={styles.metaLabel}>No downstream causal events recorded.</Text>
                )}
            </View>

            {graphSummary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GRAPH SUMMARY</Text>
                    <Text style={styles.metaValue}>Nodes: {graphSummary.nodeCount}</Text>
                    <Text style={styles.metaValue}>Edges: {graphSummary.edgeCount}</Text>
                    <Text style={styles.metaValue}>Truncated: {graphSummary.truncated ? 'YES' : 'NO'}</Text>
                    <TouchableOpacity
                        style={styles.graphButton}
                        onPress={() => navigation.navigate('GraphReplay', {
                            eventId,
                            direction: 'both',
                            maxDepth: 5,
                        })}
                    >
                        <Text style={styles.graphButtonText}>Inspect Causal Graph</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>PAYLOAD SNAPSHOT</Text>
                <View style={styles.payloadBox}>
                    <Text style={styles.payloadText}>
                        {event.payload_json ? JSON.stringify(event.payload_json, null, 2) : 'No payload associated with this event.'}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

// Assuming standard React Native Styles mapped exactly from previous iterations...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#EF4444', fontFamily: 'monospace' },
    headerBox: { padding: 24, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    eventType: { fontSize: 18, fontWeight: '700', color: '#111827', fontFamily: 'monospace', marginBottom: 8 },
    timestamp: { fontSize: 14, color: '#6B7280', fontFamily: 'monospace' },
    section: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', fontFamily: 'monospace', marginBottom: 16, letterSpacing: 1 },
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    metaLabel: { width: '35%', fontSize: 13, color: '#6B7280', marginBottom: 12 },
    metaValue: { width: '65%', fontSize: 13, color: '#111827', fontFamily: 'monospace', marginBottom: 12 },
    linkText: { width: '65%', fontSize: 13, color: '#3B82F6', fontFamily: 'monospace', marginBottom: 12, textDecorationLine: 'underline' },
    entityButton: { backgroundColor: '#111827', padding: 12, borderRadius: 6, alignItems: 'center' },
    entityButtonText: { color: '#FFFFFF', fontWeight: '600', fontFamily: 'monospace', fontSize: 12 },
    graphButton: { backgroundColor: '#111827', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 12 },
    graphButtonText: { color: '#FFFFFF', fontWeight: '600', fontFamily: 'monospace', fontSize: 12 },
    retryButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, marginTop: 12 },
    retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
    payloadBox: { backgroundColor: '#111827', padding: 16, borderRadius: 8 },
    payloadText: { fontSize: 12, color: '#A7F3D0', fontFamily: 'monospace' },
    causalityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    causalityNode: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 12 },
    childEventCard: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
    childEventType: { fontSize: 12, fontWeight: '700', color: '#111827', fontFamily: 'monospace', marginBottom: 4 },
    childEventActor: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
});
