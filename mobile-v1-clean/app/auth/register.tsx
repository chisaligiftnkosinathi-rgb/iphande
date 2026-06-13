import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { signUp } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        setErrorMessage('');

        if (!email || !password) {
            setErrorMessage("Please fill in all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password);
            router.replace('/activation');
        } catch (error: any) {
            console.error("Firebase Registration Error:", error);

            let friendlyMessage = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                friendlyMessage = "This email already belongs to a steward. Please sign in instead.";
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "Please enter a valid email address.";
            } else if (error.code === 'auth/weak-password') {
                friendlyMessage = "Your password must be at least 6 characters long.";
            }
            setErrorMessage(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.kicker}>Step 1</Text>
            <Text style={styles.title}>Become a Steward</Text>
            <Text style={styles.subtitle}>Create your account to begin.</Text>

            <View style={styles.form}>
                <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry />
                <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#9CA3AF" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={styles.primaryButtonText}>
                    {loading ? "Creating Account..." : "Create Account"}
                </Text>
            </TouchableOpacity>
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
    form: {
        width: '100%',
        gap: 16,
        marginBottom: 32,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#111827',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
