import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PageHeader } from '../components/PageHeader';

export default function AcknowledgementsScreen() {
    return (
        <ScrollView style={styles.container}>
            <PageHeader 
                eyebrow="Legal" 
                title="Acknowledgements" 
                subtitle="Open source credits and attributions." 
            />

            <View style={styles.subsection}>
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Our Purpose</Text>
                    <Text style={styles.cardText}>
                        iPhande is built for small businesses and community stewards. We believe that hard work deserves to be seen, preserved, and trusted.
                        {'\n\n'}
                        This platform is inspired by dignity, continuity, trust, and preserved work. We acknowledge every steward who wakes up to build their community.
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
