import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootTabParamList } from '../navigation';
import { getContinuityEventGraph } from '../src/services/apiClient';
import { ContinuityEvent, ContinuityEventGraph } from '../src/types/replay';
import { formatContinuityEventLabel } from '../src/utils/replayLabels';

type Props = BottomTabScreenProps<RootTabParamList, 'GraphReplay'>;

export const GraphReplayScreen: React.FC<Props> = ({ route, navigation }) => {
    const { eventId, direction = 'both', maxDepth = 5 } = route.params;
    const [graph, setGraph] = useState<ContinuityEventGraph | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        loadGraph();
    }, [eventId, direction, maxDepth]);

    const loadGraph = async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const replayGraph = await getContinuityEventGraph(eventId, direction, maxDepth);
            setGraph(replayGraph);
        } catch (error) {
            console.error('Failed to load replay graph', error);
            setErrorMessage('Graph could not be loaded from the configured API.');
            setGraph(null);
        } finally {
            setIsLoading(false);
        }
    };

    const parentByChildId = useMemo(() => {
        const parentMap: Record<string, string> = {};
        graph?.edges.forEach((edge) => {
            parentMap[edge.target_event_id] = edge.source_event_id;
        });
        return parentMap;
    }, [graph]);

    const orderedNodes = useMemo(() => {
        return [...(graph?.nodes || [])].sort((a, b) => {
            return (a.lineage_sequence || 0) - (b.lineage_sequence || 0);
        });
    }, [graph]);

    const renderNode = (node: ContinuityEvent, index: number) => {
        const isRoot = graph?.root_event.id === node.id;
        const parentId = parentByChildId[node.id] || node.parent_event_id || null;
        const hasNext = index < orderedNodes.length - 1;

        return (
            <View key={node.id}>
                <TouchableOpacity
                    style={[styles.nodeCard, isRoot && styles.rootNodeCard]}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ReplayEventDetail', { eventId: node.id })}
                >
                    <View style={styles.nodeHeader}>
                        <Text style={styles.eventType}>{formatContinuityEventLabel(node)}</Text>
                        <Text style={styles.sequenceText}>Seq {node.lineage_sequence ?? 'N/A'}</Text>
                    </View>
                    <Text style={styles.metaText}>Actor: {node.actor_type.toUpperCase()}</Text>
                    <Text style={styles.metaText}>Event: {node.id}</Text>
                    <Text style={styles.metaText}>Parent: {parentId || 'NONE'}</Text>
                </TouchableOpacity>
                {hasNext && (
                    <View style={styles.edgeConnector}>
                        <Text style={styles.edgeArrow}>v</Text>
                        <Text style={styles.edgeText}>parent to child</Text>
                    </View>
                )}
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    if (!graph) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>{errorMessage || 'Graph unavailable for this event.'}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadGraph}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.integrityBanner}>
                <Text style={styles.bannerText}>Graph reconstructed from immutable continuity relationships.</Text>
            </View>

            <View style={styles.summaryPanel}>
                <Text style={styles.sectionTitle}>ROOT EVENT</Text>
                <Text style={styles.rootType}>{formatContinuityEventLabel(graph.root_event)}</Text>
                <Text style={styles.metaText}>Direction: {graph.direction.toUpperCase()}</Text>
                <Text style={styles.metaText}>Max depth: {graph.max_depth}</Text>
                <Text style={styles.metaText}>Nodes: {graph.nodes.length}</Text>
                <Text style={styles.metaText}>Edges: {graph.edges.length}</Text>
                <Text style={styles.metaText}>Truncated: {graph.truncated ? 'YES' : 'NO'}</Text>
                <Text style={styles.metaText}>Cycle detected: {graph.cycle_detected ? 'YES' : 'NO'}</Text>
            </View>

            <View style={styles.chainSection}>
                <Text style={styles.sectionTitle}>CAUSAL CHAIN</Text>
                {orderedNodes.length > 0 ? (
                    orderedNodes.map(renderNode)
                ) : (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>No graph nodes recorded.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    content: { paddingBottom: 24 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    integrityBanner: {
        backgroundColor: '#111827',
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    bannerText: { fontSize: 12, color: '#D1D5DB', fontFamily: 'monospace', textTransform: 'uppercase' },
    summaryPanel: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    chainSection: { padding: 20 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        fontFamily: 'monospace',
        marginBottom: 12,
        letterSpacing: 1,
    },
    rootType: { fontSize: 18, color: '#111827', fontWeight: '800', fontFamily: 'monospace', marginBottom: 8 },
    nodeCard: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
        backgroundColor: '#FFFFFF',
    },
    rootNodeCard: { borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    eventType: { flex: 1, fontSize: 13, color: '#111827', fontWeight: '800', fontFamily: 'monospace', marginRight: 8 },
    sequenceText: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
    metaText: { fontSize: 12, color: '#4B5563', fontFamily: 'monospace', marginBottom: 4 },
    edgeConnector: { alignItems: 'center', paddingVertical: 10 },
    edgeArrow: { fontSize: 22, color: '#111827', fontFamily: 'monospace', lineHeight: 24 },
    edgeText: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace', textTransform: 'uppercase' },
    retryButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, marginTop: 12 },
    retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
    emptyBox: {
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 8,
    },
    emptyText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'monospace' },
});
