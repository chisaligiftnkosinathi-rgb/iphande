import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchWithAuth } from '../../config/api';

export default function OpportunityDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [opportunity, setOpportunity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchOpportunity = async () => {
        try {
            if (typeof id !== 'string') return;
            const data = await fetchWithAuth(`/opportunities/${id}`);
            setOpportunity(data);
        } catch (error) {
            console.error("Fetch opportunity error:", error);
            Alert.alert("Error", "Could not load opportunity details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunity();
    }, [id]);

    const handleCreateQuote = () => {
        // Navigate to quote creation with opportunity context
        router.push({
            pathname: '/quotes/new',
            params: { opportunity_id: id }
        });
    };

    if (loading || !opportunity) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#111827" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.kicker}>Opportunity</Text>
                <Text style={styles.title}>{opportunity.title}</Text>
                <View style={[styles.badge, styles.badgeOpen]}>
                    <Text style={styles.badgeTextOpen}>{opportunity.status?.toUpperCase() || 'OPEN'}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Details</Text>
                    <Text style={styles.primaryText}>{opportunity.description}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.sectionHeading}>Location</Text>
                    <Text style={styles.primaryText}>{opportunity.location || 'Remote'}</Text>

                    <View style={styles.divider} />
                    
                    <Text style={styles.sectionHeading}>Budget / Rate</Text>
                    <Text style={styles.primaryText}>R {opportunity.budget || opportunity.amount || '0.00'}</Text>
                </View>

                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleCreateQuote}>
                        <Text style={styles.primaryButtonText}>Create Quote for Opportunity</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 24, paddingTop: 48, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', alignItems: 'flex-start' },
    kicker: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },

    badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
    badgeOpen: { backgroundColor: '#DBEAFE' },
    badgeTextOpen: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', color: '#1E40AF' },

    content: { padding: 24 },
    card: {
        backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, marginBottom: 24,
    },
    sectionHeading: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    primaryText: { fontSize: 18, fontWeight: '500', color: '#111827', marginBottom: 4 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },
    actionSection: { gap: 12 },
    primaryButton: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
