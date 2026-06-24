import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PageHeader } from '../components/PageHeader';

export default function PrivacyScreen() {
    return (
        <ScrollView style={styles.container}>
            <PageHeader 
                eyebrow="Legal" 
                title="Privacy Policy" 
                subtitle="How we protect your data." 
            />

            <View style={styles.subsection}>
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Data Usage</Text>
                    <Text style={styles.cardText}>
                        User data is strictly used to provide visibility, leads, quotes, timeline records, and support for your business. We do not use your data for any other purposes.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>POPIA Statement</Text>
                    <Text style={styles.cardText}>
                        We are aligned with POPIA requirements:
                        {'\n\n'}• We collect only the information necessary to run the platform.
                        {'\n'}• We actively protect both steward and customer information.
                        {'\n'}• We do not sell personal data to third parties.
                        {'\n'}• You may request correction or removal of your data where legally allowed.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    subsection: { padding: 24 },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
        marginBottom: 24,
    },
    sectionHeading: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    cardText: { fontSize: 15, color: '#4B5563', lineHeight: 24 },
});
