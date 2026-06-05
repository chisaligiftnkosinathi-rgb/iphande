import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootTabParamList } from '../navigation';
import { DEMO_BUSINESS_OWNER_ID } from '../src/config/demoIdentity';
import { listContinuityEventsForBusiness } from '../src/services/apiClient';
import { fetchMobileHandshake } from '../src/services/handshakeService';
import { ActorType, ContinuityEvent, ContinuityEventType } from '../src/types/replay';
import { formatContinuityEventLabel } from '../src/utils/replayLabels';

interface ReplayTimelineScreenProps {
    businessOwnerId?: string;
    route?: { params?: { businessOwnerId?: string } };
}

type ReplayNavigation = {
    navigate: <Name extends keyof RootTabParamList>(
        name: Name,
        params?: RootTabParamList[Name]
    ) => void;
};

export const ReplayTimelineScreen: React.FC<ReplayTimelineScreenProps> = ({ businessOwnerId, route }) => {
    const navigation = useNavigation<ReplayNavigation>();
    const activeBusinessOwnerId = businessOwnerId || route?.params?.businessOwnerId || DEMO_BUSINESS_OWNER_ID;
    const [events, setEvents] = useState<ContinuityEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [filterActor, setFilterActor] = useState<ActorType | 'ALL'>('ALL');
    const [filterEntity, setFilterEntity] = useState<string | 'ALL'>('ALL');

    useEffect(() => {
        loadReplay();
    }, [activeBusinessOwnerId]);

    const loadReplay = async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const handshake = await fetchMobileHandshake();
            console.log('API handshake ok:', handshake);
            const replayEvents = await listContinuityEventsForBusiness(activeBusinessOwnerId);
            setEvents(replayEvents);
        } catch (error) {
            console.error('Failed to load replay lineage after API handshake', error);
            setErrorMessage('API handshake or replay timeline failed. Check the configured API URL and mobile network access.');
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredEvents = events.filter(item => {
        if (filterActor !== 'ALL' && item.actor_type !== filterActor) return false;
        if (filterEntity !== 'ALL' && item.related_entity_type !== filterEntity) return false;
        return true;
    });

    // Extract unique entity types for deterministic filtering
    const entityTypes = Array.from(new Set(events.map(e => e.related_entity_type).filter(Boolean))) as string[];

    // Neutral, phase-based colors. No gamification or judgment scores.
    const getEventStyle = (eventType: ContinuityEventType) => {
        const type = eventType.toLowerCase();
        if (type.includes('deleted')) return { borderLeftColor: '#9CA3AF', backgroundColor: '#F9FAFB' }; // Neutral Gray for deletion
        if (type.includes('created') || type.includes('generated')) return { borderLeftColor: '#10B981', backgroundColor: '#ECFDF5' }; // Green for inception
        if (type.includes('quote') || type.includes('received')) return { borderLeftColor: '#8B5CF6', backgroundColor: '#F5F3FF' }; // Purple for external trigger
        if (type.includes('system') || type.includes('template') || type.includes('format')) return { borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF' }; // Blue for system ops
        return { borderLeftColor: '#F59E0B', backgroundColor: '#FFFBEB' }; // Amber for updates
    };

    const renderEvent = ({ item }: { item: ContinuityEvent }) => {
        const eventStyle = getEventStyle(item.event_type);
        const occurredAt = new Date(item.created_at).toLocaleString();

        return (
            <TouchableOpacity
                style={[styles.eventCard, eventStyle]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ReplayEventDetail', { eventId: item.id })}
            >
                <View style={styles.eventHeader}>
                    <Text style={styles.eventType}>{formatContinuityEventLabel(item)}</Text>
                    <Text style={styles.timestamp}>{occurredAt}</Text>
                </View>

                <View style={styles.actorRow}>
                    <Text style={styles.actorText}>Actor: <Text style={styles.actorHighlight}>{item.actor_type}</Text></Text>
                    {item.lineage_sequence !== undefined && (
                        <Text style={styles.sequenceText}>Seq: {item.lineage_sequence}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.integrityBanner}>
                <Text style={styles.bannerText}>Replay reconstructed from immutable continuity events.</Text>
            </View>

            <View style={styles.filtersWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <Text style={styles.filterLabel}>ACTOR:</Text>
                    {['ALL', 'system', 'business_owner', 'customer'].map(actor => (
                        <TouchableOpacity
                            key={actor}
                            style={[styles.filterChip, filterActor === actor && styles.filterChipActive]}
                            onPress={() => setFilterActor(actor as any)}
                        >
                            <Text style={[styles.filterChipText, filterActor === actor && styles.filterChipTextActive]}>
                                {actor.replace('_', ' ').toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                {entityTypes.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                        <Text style={styles.filterLabel}>ENTITY:</Text>
                        <TouchableOpacity style={[styles.filterChip, filterEntity === 'ALL' && styles.filterChipActive]} onPress={() => setFilterEntity('ALL')}>
                            <Text style={[styles.filterChipText, filterEntity === 'ALL' && styles.filterChipTextActive]}>ALL</Text>
                        </TouchableOpacity>
                        {entityTypes.map(entity => (
                            <TouchableOpacity key={entity} style={[styles.filterChip, filterEntity === entity && styles.filterChipActive]} onPress={() => setFilterEntity(entity)}>
                                <Text style={[styles.filterChipText, filterEntity === entity && styles.filterChipTextActive]}>{entity.toUpperCase()}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : errorMessage ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{errorMessage}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadReplay}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    keyExtractor={(item) => item.id}
                    renderItem={renderEvent}
                    contentContainerStyle={styles.listContent}
                    // Strict deterministic rendering. No client-side sorting.
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No replay lineage available.</Text>
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

    // Integrity Banner
    integrityBanner: {
        backgroundColor: '#111827',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    bannerText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Filters
    filtersWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        paddingVertical: 8,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    filterLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginRight: 8, fontFamily: 'monospace' },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB', marginRight: 8 },
    filterChipActive: { backgroundColor: '#111827' },
    filterChipText: { fontSize: 11, color: '#4B5563', fontFamily: 'monospace', fontWeight: '600' },
    filterChipTextActive: { color: '#FFFFFF' },

    listContent: { padding: 16 },

    // Event Card Base
    eventCard: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    eventHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    eventType: { fontSize: 13, fontWeight: '700', color: '#1F2937', fontFamily: 'monospace' },
    timestamp: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },

    actorRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actorText: { fontSize: 13, color: '#4B5563' },
    actorHighlight: { fontWeight: '600', color: '#111827' },
    sequenceText: { fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' },

    // Expansion Detail
    expandedDetails: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    metaGrid: { marginBottom: 12 },
    metaLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    metaValue: { color: '#111827', fontFamily: 'monospace' },

    payloadBox: {
        backgroundColor: '#111827',
        padding: 12,
        borderRadius: 6,
        marginTop: 8,
    },
    payloadTitle: { fontSize: 11, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase' },
    payloadText: { fontSize: 12, color: '#A7F3D0', fontFamily: 'monospace' }, // Terminal green text for payload

    // Empty State Doctrine
    emptyState: {
        marginTop: 40,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 8,
    },
    emptyText: { fontSize: 14, color: '#9CA3AF', fontFamily: 'monospace' },
    retryButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, marginTop: 12 },
    retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
});
