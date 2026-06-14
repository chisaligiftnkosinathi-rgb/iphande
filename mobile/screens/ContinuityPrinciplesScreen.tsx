import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';

const ContinuityPrinciplesScreen: React.FC = () => {
    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Continuity Principles" />
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Our Principles</Text>
                    <Text style={styles.body}>
                        Inspired by South African constitutional values, iPhande is guided by:
                    </Text>
                    <Text style={styles.listItem}>• Human dignity</Text>
                    <Text style={styles.listItem}>• Equality</Text>
                    <Text style={styles.listItem}>• Freedom</Text>
                    <Text style={styles.listItem}>• Accountability</Text>
                    <Text style={styles.listItem}>• Non-racialism</Text>
                    <Text style={styles.listItem}>• Non-sexism</Text>
                    <Text style={styles.listItem}>• Protection of personal information</Text>

                    <Text style={styles.subTitle}>Privacy & Consent</Text>
                    <Text style={styles.body}>
                        Our operations are POPIA-aligned. We respect your privacy and process data only with explicit consent and transparent stewardship.
                    </Text>

                    <Text style={styles.disclaimer}>
                        Disclaimer: The information provided on this platform does not constitute and is not intended to replace formal legal advice or official law.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 16 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
    subTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 16, marginBottom: 8 },
    body: { fontSize: 15, lineHeight: 24, color: '#374151', marginBottom: 12 },
    listItem: { fontSize: 15, lineHeight: 24, color: '#374151', marginLeft: 8 },
    disclaimer: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginTop: 24 },
});

export default ContinuityPrinciplesScreen;
