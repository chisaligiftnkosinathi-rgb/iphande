import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const timelineEvents = [
    {
        id: 1,
        title: 'Profile created',
        time: '08:30 AM',
        description: 'User profile initialized successfully.',
        status: 'completed',
    },
    {
        id: 2,
        title: 'Opportunity added',
        time: '10:15 AM',
        description: 'New community business opportunity recorded.',
        status: 'active',
    },
    {
        id: 3,
        title: 'Reflection submitted',
        time: '01:40 PM',
        description: 'Reflection entry linked to campaign activity.',
        status: 'pending',
    },
];

const TimelineScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>Activity Replay</Text>

                <Text style={styles.title}>Timeline</Text>

                <Text style={styles.description}>
                    Observe important business activities, reflections, opportunity changes, and community interactions over time.
                </Text>
            </View>

            <View style={styles.timelineContainer}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>

                {timelineEvents.map((event, index) => (
                    <View key={event.id} style={styles.timelineRow}>
                        <View style={styles.leftColumn}>
                            <View
                                style={[
                                    styles.timelineDot,
                                    event.status === 'completed' && styles.completedDot,
                                    event.status === 'active' && styles.activeDot,
                                    event.status === 'pending' && styles.pendingDot,
                                ]}
                            />

                            {index !== timelineEvents.length - 1 && (
                                <View style={styles.timelineLine} />
                            )}
                        </View>

                        <View style={styles.eventCard}>
                            <View style={styles.eventHeader}>
                                <Text style={styles.eventTitle}>{event.title}</Text>

                                <Text style={styles.eventTime}>{event.time}</Text>
                            </View>

                            <Text style={styles.eventDescription}>
                                {event.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.boundaryCard}>
                <Text style={styles.boundaryTitle}>Replay integrity</Text>

                <Text style={styles.boundaryText}>
                    Timeline entries should preserve truthful historical visibility and avoid silently hiding edits, state changes, or evidence-linked activity.
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
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    leftColumn: {
        alignItems: 'center',
        width: 30,
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
    timelineContainer: {
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
        marginBottom: 20,
    },
    // ...existing code...
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginTop: 6,
    },
    completedDot: {
        backgroundColor: '#16A34A',
    },
    activeDot: {
        backgroundColor: '#2563EB',
    },
    pendingDot: {
        backgroundColor: '#F59E0B',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#D1D5DB',
        marginTop: 4,
    },
    eventCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 16,
        marginLeft: 10,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    eventTime: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    eventDescription: {
        fontSize: 14,
        lineHeight: 20,
        color: '#4B5563',
    },
    boundaryCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1D4ED8',
        marginBottom: 8,
    },
    boundaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#1E40AF',
    },
});

export default TimelineScreen;
