import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
    const router = useRouter();

    const handleComingSoon = () => {
        Alert.alert('Coming Soon', 'This pathway is being prepared for V1 launch.');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>iPhande</Text>
                <Text style={styles.subtitle}>Make your work visible.</Text>
                <Text style={styles.subtitle}>Build trust through real service.</Text>
            </View>

            <View style={styles.actionContainer}>
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleComingSoon}>
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>Register Business</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleComingSoon}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={handleComingSoon}>
                    <Text style={[styles.buttonText, styles.outlineButtonText]}>Explore Businesses</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F3EA', justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 48 },
    title: { fontSize: 42, fontWeight: '900', color: '#24352F', marginBottom: 16, letterSpacing: -1 },
    subtitle: { fontSize: 18, color: '#5D7A5A', fontStyle: 'italic', marginBottom: 4, textAlign: 'center' },

    actionContainer: { gap: 16, maxWidth: 400, width: '100%', alignSelf: 'center' },

    button: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontSize: 16, fontWeight: 'bold' },

    primaryButton: { backgroundColor: '#24352F', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    primaryButtonText: { color: '#FFFFFF' },

    secondaryButton: { backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#E8DFD0' },
    secondaryButtonText: { color: '#24352F' },

    outlineButton: { backgroundColor: 'transparent' },
    outlineButtonText: { color: '#6F7D75', textDecorationLine: 'underline' }
});
