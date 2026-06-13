import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSteward } from '../../src/context/StewardContext';
import { useAuth } from '../../src/context/AuthContext';
import { Link } from 'expo-router';
import { PageHeader } from '../../src/components/PageHeader';

export default function SupportScreen() {
    const { profile } = useSteward();
    const { user } = useAuth();

    const handleWhatsApp = () => {
        const name = profile?.name || 'Steward';
        const email = user?.email || 'Unknown Email';
        const text = encodeURIComponent(`Hi iPhande Support,\n\nI need some help.\nName: ${name}\nEmail: ${email}`);
        Linking.openURL(`https://wa.me/27711603850?text=${text}`);
    };

    return (
        <ScrollView style={styles.container}>
            <PageHeader 
                eyebrow="Help Center" 
                title="Support" 
                subtitle="Get help and guidance for your business." 
            />

            <View style={styles.subsection}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Quick Guides</Text>

                    <Text style={styles.guideTitle}>How to complete Visibility</Text>
                    <Text style={styles.guideText}>Go to the Visibility tab and fill in your services, location, and upload your logo and previous work. Your public profile acts as your business website.</Text>

                    <Text style={styles.guideTitle}>How to receive leads</Text>
                    <Text style={styles.guideText}>Customers can request quotes directly from your public profile. These requests appear in your Leads tab automatically.</Text>

                    <Text style={styles.guideTitle}>How to create quotes</Text>
                    <Text style={styles.guideText}>Tap any Lead to open the Quote Builder, or create a standalone quote from your Home Workbench. Add materials, labour, and generate a professional PDF.</Text>

                    <Text style={styles.guideTitle}>How to record proof of work</Text>
                    <Text style={styles.guideText}>Once a job is finished, upload photos to the Proof of Work tool to build your verified timeline history.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardText}>
                        Still stuck? Reach out to our support team directly. We are here to help you preserve and grow your business.
                    </Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={handleWhatsApp}>
                        <Text style={styles.primaryButtonText}>Contact via WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                <Link href="/legal" asChild>
                    <TouchableOpacity style={{ padding: 16, alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '600' }}>Legal, POPIA & Acknowledgements</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
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
    cardTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    guideTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 4 },
    guideText: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 16 },
    cardText: { fontSize: 15, color: '#4B5563', lineHeight: 24, marginBottom: 24 },
    primaryButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
