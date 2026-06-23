import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { OpportunityQuickActions } from '../OpportunityQuickActions';
import { ContinuityMeta } from '../components/ui/ContinuityMeta';
import { TruthCard } from '../components/ui/TruthCard';
import { navigateTo } from '../navigation';

const OpportunitiesScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>Opportunity Ledger</Text>
                <Text style={styles.title}>Opportunities</Text>
                <Text style={styles.description}>
                    Track business leads, community needs, service requests, and follow-up actions in one governed place.
                </Text>
            </View>


            <View style={styles.actionRow}>
                <Pressable style={styles.primaryButton} onPress={() => { }}>
                    <Text style={styles.primaryButtonText}>Create Opportunity</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => navigateTo('ContentGenerator')}>
                    <Text style={styles.primaryButtonText}>Create Business Post</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => navigateTo('QuoteRequestsDashboard')}>
                    <Text style={styles.primaryButtonText}>Quote Requests</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Refresh List</Text>
                </Pressable>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Opportunities</Text>

                {/* Mock Opportunity Card to demonstrate contextual actions */}
                <TruthCard>
                    <View style={styles.cardHeader}>
                        <Text style={styles.clientName}>Sipho & Family</Text>
                        <Text style={styles.opportunityStatus}>Inquiry</Text>
                    </View>
                    <Text style={styles.opportunityDetails}>Requested a quote and operational details for an upcoming community event.</Text>

                    <ContinuityMeta label="Opportunity Opened" value="REV-OPP-789 • 2026-05-27 12:00 PM" />

                    <Text style={styles.actionEyebrow}>Lineage Actions</Text>
                    <OpportunityQuickActions
                        opportunityId="OPP-12345"
                        targetContinuityEventId="REV-OPP-789"
                    />
                </TruthCard>
            </View>

            <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Production boundary</Text>
                <Text style={styles.noteText}>
                    This screen should list opportunities, support creation, and preserve timeline evidence without hiding status changes.
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
    actionRow: {
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
    // ...existing code...
    secondaryButtonText: {
        color: '#1E3A2F',
        fontWeight: '700',
        fontSize: 14,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clientName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#102A20',
    },
    opportunityStatus: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#3E6B57',
    },
    opportunityDetails: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    actionEyebrow: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#9CA3AF',
        marginTop: 8,
    },
    noteCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#14532D',
        marginBottom: 6,
    },
    noteText: {
        fontSize: 13,
        lineHeight: 19,
        color: '#166534',
    },
});

export default OpportunitiesScreen;
