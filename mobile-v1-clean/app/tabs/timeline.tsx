import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';
import { ShareButton } from '../../src/components/ShareButton';
import { shareProofOfWork } from '../../src/services/shareApi';

export default function TimelineScreen() {
    const { profile } = useSteward();
    const [events, setEvents] = useState<any[]>([]);
    const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await fetchWithAuth(`/continuity-events/business/${profile?.id}`);
            const captureEvents = (data || [])
                .filter((event: any) => event.related_entity_type === "continuity_capture" || event.related_entity_type === "quote")
                .sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            setEvents(captureEvents);
        } catch (error) {
            console.error("Timeline fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.id) {
            fetchEvents();
        }
    }, [profile?.id]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZA', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDotStyle = (type: string) => {
        if (type === 'Work Completed') return styles.timelineDotCompleted;
        if (type === 'Observation') return styles.timelineDotObservation;
        return styles.timelineDotNeutral;
    };

    const visibleEvents = events.filter(
        (event) => !hiddenEventIds.includes(event.id)
    );

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEvents} />}
        >
            <View style={styles.header}>
                <Text style={styles.kicker}>Continuity Ledger</Text>
                <Text style={styles.title}>Steward Timeline</Text>
                <Text style={styles.subtitle}>The history of your work and promises.</Text>
            </View>

            <View style={styles.section}>
                {loading && events.length === 0 ? (
                    <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
                ) : visibleEvents.length === 0 ? (
                    <Text style={styles.emptyText}>No events recorded yet. Add your first capture from the Dashboard!</Text>
                ) : (
                    visibleEvents.map((event, index) => {
                        const payload = event.payload_json || {};
                        const isLast = index === visibleEvents.length - 1;

                        if (event.related_entity_type === 'quote') {
                            const lineItems = payload.line_items || [];
                            const itemsCount = lineItems.length;
                            const totalAmount = parseFloat(payload.total || payload.amount) || 0;
                            const formattedTotal = totalAmount.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });
                            
                            const itemsSummary = itemsCount > 0 
                                ? `${itemsCount} item${itemsCount > 1 ? 's' : ''} • ${formattedTotal}`
                                : formattedTotal;

                            return (
                                <View key={event.id || index} style={styles.timelineItem}>
                                    {!isLast && <View style={styles.timelineLine} />}
                                    <View style={styles.timelineDotQuote} />
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.dateText}>{formatDate(event.created_at)}</Text>
                                        <Text style={styles.eventTitle}>Quote Issued</Text>
                                        
                                        <View style={styles.quoteDetailsContainer}>
                                            <Text style={styles.quoteDetailLabel}>Customer:</Text>
                                            <Text style={styles.quoteDetailValue}>{payload.customer_name || 'Unknown'}</Text>
                                        </View>
                                        
                                        {payload.service_description ? (
                                            <View style={styles.quoteDetailsContainer}>
                                                <Text style={styles.quoteDetailLabel}>Service:</Text>
                                                <Text style={styles.quoteDetailValue}>{payload.service_description}</Text>
                                            </View>
                                        ) : null}

                                        {(() => {
                                             const planning = payload.structured_terms?.planning || {};
                                             const hasPlanning = 
                                                 (planning.expected_labour_hours !== null && planning.expected_labour_hours !== undefined && planning.expected_labour_hours !== '') ||
                                                 (planning.expected_travel_km !== null && planning.expected_travel_km !== undefined && planning.expected_travel_km !== '') ||
                                                 (planning.expected_material_cost !== null && planning.expected_material_cost !== undefined && planning.expected_material_cost !== '') ||
                                                 (planning.expected_notes !== null && planning.expected_notes !== undefined && planning.expected_notes !== '');
                                             
                                             if (!hasPlanning) return null;

                                             return (
                                                 <View style={styles.planningTimelineContainer}>
                                                     <Text style={styles.planningTimelineTitle}>Planned:</Text>
                                                     {planning.expected_labour_hours !== null && planning.expected_labour_hours !== undefined && planning.expected_labour_hours !== '' && (
                                                         <Text style={styles.planningTimelineText}>• {planning.expected_labour_hours} labour hours</Text>
                                                     )}
                                                     {planning.expected_travel_km !== null && planning.expected_travel_km !== undefined && planning.expected_travel_km !== '' && (
                                                         <Text style={styles.planningTimelineText}>• {planning.expected_travel_km} km travel</Text>
                                                     )}
                                                     {planning.expected_material_cost !== null && planning.expected_material_cost !== undefined && planning.expected_material_cost !== '' && (
                                                         <Text style={styles.planningTimelineText}>• R {Number(planning.expected_material_cost).toFixed(2)} materials</Text>
                                                     )}
                                                     {planning.expected_notes !== null && planning.expected_notes !== undefined && planning.expected_notes !== '' && (
                                                         <Text style={[styles.planningTimelineText, { fontStyle: 'italic' }]}>• Note: {planning.expected_notes}</Text>
                                                     )}
                                                 </View>
                                             );
                                         })()}

                                        <View style={styles.quoteSummaryRow}>
                                            <Text style={styles.quoteSummaryText}>{itemsSummary}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.hideButton}
                                            onPress={() => setHiddenEventIds((prev) => [...prev, event.id])}
                                        >
                                            <Text style={styles.hideButtonText}>Hide</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }

                        const captureType = payload.capture_type || "Event";

                        return (
                            <View key={event.id || index} style={styles.timelineItem}>
                                {!isLast && <View style={styles.timelineLine} />}
                                <View style={getDotStyle(captureType)} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.dateText}>{formatDate(event.created_at)}</Text>
                                    <Text style={styles.eventTitle}>
                                        {captureType}: {payload.title || "Untitled"}
                                    </Text>
                                    {payload.description ? (
                                        <Text style={styles.eventDescription}>
                                            {payload.description}
                                        </Text>
                                    ) : null}

                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={styles.hideButton}
                                            onPress={() => setHiddenEventIds((prev) => [...prev, event.id])}
                                        >
                                            <Text style={styles.hideButtonText}>Hide</Text>
                                        </TouchableOpacity>
                                        {captureType === 'Work Completed' && (
                                            <ShareButton 
                                                fetchShareText={() => shareProofOfWork(event.id)}
                                                label="Share"
                                                style={styles.shareBtn}
                                            />
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 24,
        paddingTop: 56,
        paddingBottom: 32,
        backgroundColor: '#F9FAFB',
    },
    kicker: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
    section: {
        padding: 24,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 24,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 7,
        top: 24,
        bottom: -24,
        width: 2,
        backgroundColor: '#E5E7EB',
    },
    timelineDotCompleted: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981', // Green for completed/success
        marginTop: 4,
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#D1FAE5',
    },
    timelineDotNeutral: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#9CA3AF', // Gray for standard events
        marginTop: 4,
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#F3F4F6',
    },
    timelineDotObservation: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#3B82F6', // Blue for observation
        marginTop: 4,
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#DBEAFE',
    },
    timelineContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    eventDescription: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    hideButton: {
        marginTop: 10,
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
    },
    hideButtonText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6B7280",
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#6B7280',
        marginTop: 40,
    },
    timelineDotQuote: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        marginTop: 4,
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#D1FAE5',
    },
    quoteDetailsContainer: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    quoteDetailLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        width: 90,
    },
    quoteDetailValue: {
        fontSize: 14,
        color: '#111827',
        flex: 1,
    },
    quoteSummaryRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginBottom: 12,
    },
    quoteSummaryText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    shareBtn: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    planningTimelineContainer: {
        marginTop: 8,
        paddingLeft: 4,
    },
    planningTimelineTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 2,
    },
    planningTimelineText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
    },
});
