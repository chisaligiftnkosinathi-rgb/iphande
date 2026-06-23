import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootTabParamList } from '../navigation';
import { listContinuityEventsForEntity } from '../src/services/apiClient';
import { ContinuityEvent } from '../src/types/replay';
import { formatContinuityEventLabel } from '../src/utils/replayLabels';

type Props = BottomTabScreenProps<RootTabParamList, 'EntityReplay'>;

export const EntityReplayScreen: React.FC<Props> = ({ route, navigation }) => {
    const { entityId, entityType } = route.params;
    const [events, setEvents] = useState<ContinuityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        loadEntityReplay();
    }, [entityId]);

    const loadEntityReplay = async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const replayEvents = await listContinuityEventsForEntity(entityId);
            setEvents(replayEvents);
        } catch (error) {
            console.error('Failed to load entity replay', error);
            setErrorMessage('Entity replay could not be loaded from the configured API.');
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderEvent = ({ item, index }: { item: ContinuityEvent, index: number }) => {
        const occurredAt = new Date(item.created_at).toLocaleString();
        const isLast = index === events.length - 1;

        return (
            <View style={styles.timelineRow}>
                <View style={styles.nodeColumn}>
                    <View style={styles.node} />
                    {!isLast && <View style={styles.line} />}
                </View>
                <TouchableOpacity
                    style={styles.eventCard}
                    onPress={() => navigation.navigate('ReplayEventDetail', { eventId: item.id })}
                >
                    <Text style={styles.eventType}>{formatContinuityEventLabel(item)}</Text>
                    <Text style={styles.timestamp}>{occurredAt}</Text>
                    <Text style={styles.actorText}>Actor: {item.actor_type}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ENTITY CONTINUITY</Text>
                <Text style={styles.headerSubtitle}>{entityType.toUpperCase()}</Text>
                <Text style={styles.entityIdText}>{entityId}</Text>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : errorMessage ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{errorMessage}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadEntityReplay}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id}
                    renderItem={renderEvent}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No lineage found for this entity.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 24, backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', fontFamily: 'monospace', marginBottom: 4, letterSpacing: 1 },
    headerSubtitle: { fontSize: 18, fontWeight: '700', color: '#111827', fontFamily: 'monospace', marginBottom: 4 },
    entityIdText: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
    listContent: { padding: 24 },
    timelineRow: { flexDirection: 'row', minHeight: 80 },
    nodeColumn: { width: 30, alignItems: 'center' },
    node: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', zIndex: 1, marginTop: 4 },
    line: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: -4 },
    eventCard: { flex: 1, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    eventType: { fontSize: 13, fontWeight: '700', color: '#111827', fontFamily: 'monospace', marginBottom: 4 },
    timestamp: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace', marginBottom: 8 },
    actorText: { fontSize: 12, color: '#4B5563' },
    emptyState: { padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 8 },
    emptyText: { fontSize: 13, color: '#9CA3AF', fontFamily: 'monospace' },
    retryButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, marginTop: 12 },
    retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
});
