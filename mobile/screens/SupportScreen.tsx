import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { navigateTo } from '../navigation';
import { useAuth } from '../src/auth/AuthContext';

const archetypeSupportMap: Record<string, string[]> = {
    tech_digital_services: [
        'Quotes and project scoping',
        'Client communication and content',
        'Payment proof and support tickets'
    ],
    food_and_catering: [
        'Orders, stock, and delivery',
        'Event bookings',
        'Pricing adjustments'
    ],
    commission_based_sales: [
        'Leads and follow-ups',
        'Sale evidence verification',
        'Commission status tracking'
    ],
    community_ministry_steward: [
        'Giving and contributions',
        'Campaigns and announcements',
        'Community records'
    ]
};

const COMMON_SUPPORT_OPTIONS = [
    'Profile & visibility help',
    'Content generation help',
    'Leads / quote requests help',
    'Inventory / giving help',
    'Payment / commission help',
    'Replay / continuity help',
];

const SupportScreen: React.FC = () => {
    const { stewardId, selectedBusinessArchetypeKey } = useAuth() as any;

    const archetypeKey = selectedBusinessArchetypeKey || 'default';
    const specificSupport = archetypeSupportMap[archetypeKey] || [
        'Profile and visibility management',
        'Managing opportunities and leads',
        'Navigating the continuity river'
    ];

    const handleWhatsApp = () => {
        Alert.alert('WhatsApp Support', 'WhatsApp support link pending.');
    };

    const handleRequestHelp = () => {
        Alert.alert('Request Help', 'Support request capture pending.');
    };

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Support" />
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <Text style={styles.eyebrow}>Umuntu ngumuntu ngabantu</Text>
                    <Text style={styles.title}>How can we help you continue?</Text>
                    <Text style={styles.description}>
                        A steward continues through community.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Archetype Guidance</Text>
                    <Text style={styles.contextText}>
                        Based on your role ({archetypeKey.replace(/_/g, ' ')}), we can specifically assist with:
                    </Text>
                    {specificSupport.map((item, idx) => (
                        <Text key={idx} style={styles.listItem}>• {item}</Text>
                    ))}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Common Support Options</Text>
                    {COMMON_SUPPORT_OPTIONS.map((item, idx) => (
                        <Text key={idx} style={styles.listItem}>• {item}</Text>
                    ))}
                </View>

                <View style={styles.doctrineCard}>
                    <Text style={styles.doctrineTitle}>Our Support Philosophy</Text>
                    <Text style={styles.doctrineText}>
                        Support is not gatekeeping.{'\n'}
                        Support is stewardship.{'\n\n'}
                        If a steward cannot pay today, the river does not close.{'\n'}
                        We help where we can, preserve the journey, and allow value to grow truthfully.
                    </Text>

                    <Text style={styles.doctrineTitle}>System Contribution</Text>
                    <Text style={styles.doctrineText}>
                        Suggested setup contribution: R120.{'\n'}
                        If you cannot pay today, speak to a steward.{'\n'}
                        Access may still be granted where the need is real.
                    </Text>
                </View>

                <View style={styles.actionRow}>
                    <Pressable style={styles.primaryButton} onPress={handleWhatsApp}>
                        <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>WhatsApp Support</Text>
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={handleRequestHelp}>
                        <Ionicons name="help-circle-outline" size={18} color="#1E3A2F" />
                        <Text style={styles.secondaryButtonText}>Request Steward Help</Text>
                    </Pressable>
                </View>

                <Pressable style={styles.ghostButton} onPress={() => navigateTo('ContinuityPrinciples')}>
                    <Text style={styles.ghostButtonText}>View Continuity Principles</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 16 },
    heroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    eyebrow: { fontSize: 13, fontWeight: '800', color: '#2F6B4F', textTransform: 'uppercase', marginBottom: 6 },
    title: { fontSize: 24, fontWeight: '900', color: '#102A20', marginBottom: 6 },
    description: { fontSize: 15, color: '#4B5563', fontStyle: 'italic' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
    contextText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
    listItem: { fontSize: 14, color: '#374151', marginBottom: 6, paddingLeft: 4 },
    doctrineCard: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#BFDBFE' },
    doctrineTitle: { fontSize: 15, fontWeight: '900', color: '#1E40AF', marginBottom: 6, textTransform: 'uppercase' },
    doctrineText: { fontSize: 14, lineHeight: 22, color: '#1D4ED8', fontWeight: '700', marginBottom: 16 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    primaryButton: {
        flex: 1, backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    secondaryButton: {
        flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14,
        borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6
    },
    secondaryButtonText: { color: '#1E3A2F', fontWeight: '800', fontSize: 13 },
    ghostButton: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        marginBottom: 20,
    },
    ghostButtonText: { color: '#4B5563', fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
});

export default SupportScreen;
