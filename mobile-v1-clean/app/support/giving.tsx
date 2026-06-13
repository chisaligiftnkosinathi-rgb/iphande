import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSteward } from '../../src/context/StewardContext';
import { useAuth } from '../../src/context/AuthContext';
import { PageHeader } from '../../src/components/PageHeader';

export default function GivingScreen() {
    const { profile } = useSteward();
    const { user } = useAuth();

    const handleWhatsApp = () => {
        const name = profile?.name || 'Steward';
        const email = user?.email || 'Unknown Email';
        const text = encodeURIComponent(`Hi iPhande Support,\n\nI am interested in voluntary giving to support the platform.\nName: ${name}\nEmail: ${email}`);
        Linking.openURL(`https://wa.me/27711603850?text=${text}`);
    };

    return (
        <ScrollView style={styles.container}>
            <PageHeader 
                eyebrow="Help Center" 
                title="Voluntary Giving" 
                subtitle="Contribute to the steward ecosystem." 
            />

            <View style={styles.subsection}>
                <View style={styles.card}>
                    <Text style={styles.cardText}>
                        Giving is entirely voluntary. There is no pressure to contribute. Your giving helps us keep visibility tools accessible for small businesses and community stewards.
                    </Text>
                </View>

                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleWhatsApp}>
                        <Text style={styles.primaryButtonText}>Contact Support via WhatsApp</Text>
                    </TouchableOpacity>
                </View>
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 24,
    },
    cardText: { fontSize: 16, color: '#4B5563', lineHeight: 24, fontStyle: 'italic' },
    actionContainer: { gap: 12 },
    primaryButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    secondaryButtonText: { color: '#111827', fontWeight: '700', fontSize: 16 },
});
