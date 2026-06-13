import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.kicker}>iPhande V1</Text>
            <Text style={styles.title}>Your work matters.</Text>
            <Text style={styles.subtitle}>Let's help people find it.</Text>

            <Link href="/auth/register" style={styles.primaryButton}>
                Become a Steward
            </Link>

            <Link href="/auth/login" style={styles.secondaryButton}>
                Login
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    kicker: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 32,
    },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#111827',
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '700',
        marginBottom: 12,
    },
    secondaryButton: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#111827',
        color: '#111827',
        textAlign: 'center',
        fontWeight: '700',
    },
});
