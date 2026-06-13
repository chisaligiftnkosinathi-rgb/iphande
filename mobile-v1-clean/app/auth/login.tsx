import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { signIn } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        setErrorMessage('');

        if (!email || !password) {
            setErrorMessage("Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            router.replace('/tabs/home');
        } catch (error: any) {
            console.error("Firebase Login Error:", error);

            let friendlyMessage = "An unexpected error occurred. Please try again.";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                friendlyMessage = "Incorrect email or password. Please try again.";
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "Please enter a valid email address.";
            } else if (error.code === 'auth/too-many-requests') {
                friendlyMessage = "Too many failed attempts. Please try again later.";
            }
            setErrorMessage(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Access your timeline.</Text>

            <View style={styles.form}>
                <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.primaryButtonText}>
                    {loading ? "Logging in..." : "Login"}
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
