import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { PageHeader } from '../components/PageHeader';

export default function LegalIndexScreen() {
    return (
        <ScrollView style={styles.container}>
            <PageHeader 
                eyebrow="Legal" 
                title="Legal & Privacy" 
                subtitle="Important terms and conditions." 
            />

            <View style={styles.subsection}>
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Ownership</Text>
                    <Text style={styles.cardText}>
                        iPhande is operated by Global IT and Business Solutions (Pty) Ltd. 
                        It is the intellectual property of Global IT and Business Solutions (Pty) Ltd.
                    </Text>
                </View>

                <View style={styles.actionContainer}>
                    <Link href="/legal/privacy" asChild>
                        <TouchableOpacity style={styles.menuRow}>
                            <Text style={styles.menuLabel}>Privacy & POPIA</Text>
                            <Text style={styles.menuArrow}>→</Text>
                        </TouchableOpacity>
                    </Link>

                    <View style={styles.divider} />

                    <Link href="/legal/acknowledgements" asChild>
                        <TouchableOpacity style={styles.menuRow}>
                            <Text style={styles.menuLabel}>Acknowledgements</Text>
                            <Text style={styles.menuArrow}>→</Text>
                        </TouchableOpacity>
                    </Link>
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
    actionContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    menuLabel: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    menuArrow: { fontSize: 20, color: '#9CA3AF' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }
});
