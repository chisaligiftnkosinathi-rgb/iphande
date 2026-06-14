import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { buildApiUrl } from '../../config/api';
import { useSteward } from '../../context/StewardContext';

export default function OnboardingScreen() {
    const { completeOnboarding, user } = useSteward();
    const router = useRouter();

    const [stewardName, setStewardName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [location, setLocation] = useState('');
    const [services, setServices] = useState('');
    const [story, setStory] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleComplete = async () => {
        if (!user?.uid || !user?.email) {
            setError('Missing authentication. Please sign in again.');
            return;
        }
        if (!stewardName || !businessName) {
            setError('Steward Name and Business Name are required.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Create the real profile in the Railway vault using the Firebase owner_id
            const response = await fetch(buildApiUrl('profiles'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: businessName,
                    email: user.email,
                    owner_id: user.uid,
                    whatsapp_number: whatsappNumber,
                    location_string: location,
                    services: services,
                    short_bio: story
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Failed to establish identity: ${errText}`);
            }

            const data = await response.json();

            // Save profileId in StewardContext and proceed to Visibility
            completeOnboarding(data.id, 'default', stewardName);
            router.replace('/profile/visibility');

        } catch (e: any) {
            setError(e.message || 'Failed to establish identity.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.welcomeSection}>
                <Text style={styles.title}>Establish Identity</Text>
                <Text style={styles.subtitle}>Who are you, steward?</Text>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>1. Steward Name</Text>
                <TextInput style={styles.input} placeholder="Your personal name" value={stewardName} onChangeText={setStewardName} />

                <Text style={styles.label}>2. Business / Service Name</Text>
                <TextInput style={styles.input} placeholder="Mandla Auto Repairs" value={businessName} onChangeText={setBusinessName} />

                <Text style={styles.label}>3. Phone / WhatsApp</Text>
                <TextInput style={styles.input} placeholder="27710000000" value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" />

                <Text style={styles.label}>4. Location</Text>
                <TextInput style={styles.input} placeholder="Klarinet, Emalahleni" value={location} onChangeText={setLocation} />

                <Text style={styles.label}>5. Main Service Offered</Text>
                <TextInput style={styles.input} placeholder="Vehicle repairs, brakes, servicing" value={services} onChangeText={setServices} />

                <Text style={styles.label}>6. Short Public Story</Text>
                <TextInput style={styles.textArea} placeholder="I help people keep their vehicles safe..." value={story} onChangeText={setStory} multiline />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleComplete} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Preserve Identity</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F3EA' },
    contentContainer: { padding: 24, maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 60 },
    welcomeSection: { marginBottom: 32, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#24352F', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#6F7D75', fontStyle: 'italic', textAlign: 'center' },
    formGroup: { backgroundColor: '#FFFDF8', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E8DFD0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#24352F', marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    textArea: { backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
    errorText: { color: 'red', marginBottom: 16, textAlign: 'center' },
    button: { backgroundColor: '#24352F', padding: 16, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
