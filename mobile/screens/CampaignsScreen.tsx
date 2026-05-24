import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const campaigns = [
    {
        id: 1,
        name: 'Youth Business Awareness',
        status: 'Active',
        reach: '1,240 people',
    },
    {
        id: 2,
        name: 'Local Vendor Promotion',
        status: 'Planning',
        reach: 'Pending',
    },
    {
        id: 3,
        name: 'Community Skills Drive',
        status: 'Completed',
        reach: '3,890 people',
    },
];

const CampaignsScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>Outreach Operations</Text>

                <Text style={styles.title}>Campaigns</Text>

                <Text style={styles.description}>
                    Coordinate outreach initiatives, promotional activities, awareness drives, and business growth campaigns.
                </Text>
            </View>

            <View style={styles.actionCard}>
                <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>
                        Create Campaign
                    </Text>
                </Pressable>

                <Pressable style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>
                        View Analytics
                    </Text>
                </Pressable>
            </View>

            <View style={styles.campaignsCard}>
                <Text style={styles.sectionTitle}>Campaign Activity</Text>

                {campaigns.map((campaign) => (
                    <View key={campaign.id} style={styles.campaignItem}>
                        <View style={styles.campaignHeader}>
                            <Text style={styles.campaignName}>
                                {campaign.name}
                            </Text>

                            <View
                                style={[
                                    styles.statusBadge,
                                    campaign.status === 'Active' &&
                                    styles.activeBadge,
                                    campaign.status === 'Planning' &&
                                    styles.planningBadge,
                                    campaign.status === 'Completed' &&
                                    styles.completedBadge,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusText,
                                        campaign.status === 'Active' &&
                                        styles.activeText,
                                        campaign.status === 'Planning' &&
                                        styles.planningText,
                                        campaign.status === 'Completed' &&
                                        styles.completedText,
                                    ]}
                                >
                                    {campaign.status}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.reachText}>
                            Reach: {campaign.reach}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.boundaryCard}>
                <Text style={styles.boundaryTitle}>
                    Campaign continuity
                </Text>

                <Text style={styles.boundaryText}>
                    Campaign history, status changes, and outreach activity should remain visible and traceable over time.
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
        paddingHorizontal: 20,
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
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        shadowColor: '#102A20',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        flexDirection: 'row',
        gap: 12,
        marginVertical: 18,
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
    // ...existing code...
    secondaryButtonText: {
        color: '#1E3A2F',
        fontWeight: '700',
        fontSize: 14,
    },
    campaignsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    campaignItem: {
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
    },
    campaignHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    campaignName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginRight: 12,
    },
    statusBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    activeBadge: {
        backgroundColor: '#DCFCE7',
    },
    planningBadge: {
        backgroundColor: '#FEF3C7',
    },
    completedBadge: {
        backgroundColor: '#DBEAFE',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    activeText: {
        color: '#166534',
    },
    planningText: {
        color: '#92400E',
    },
    completedText: {
        color: '#1D4ED8',
    },
    reachText: {
        fontSize: 14,
        color: '#4B5563',
    },
    boundaryCard: {
        backgroundColor: '#F5F3FF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#5B21B6',
        marginBottom: 8,
    },
    boundaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#6D28D9',
    },
});

export default CampaignsScreen;
