import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '../api/supabase';

export default function VerifyEmailScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const { resendVerificationEmail } = useAuth();

    const checkVerification = async () => {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user.email_confirmed_at) {
            router.replace('/activation');
            return;
        }

        Alert.alert('Not verified yet', 'Please open the email link first, then try again.');
    };

    const handleResend = async () => {
        if (!email) return;
        try {
            await resendVerificationEmail(email);
            Alert.alert('Email Sent', 'A new verification link has been sent to your email.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to resend email.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.body}>
                We sent a verification link to {email || 'your email address'}.
                Please tap the link to verify your account.
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={checkVerification}>
                <Text style={styles.primaryButtonText}>I verified my email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleResend}>
                <Text style={styles.secondaryButtonText}>Resend link</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F9FAFB' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16, textAlign: 'center' },
    body: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
    primaryButton: { backgroundColor: '#111827', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    secondaryButton: { padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
    secondaryButtonText: { color: '#374151', fontWeight: 'bold', fontSize: 16 }
});
