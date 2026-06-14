import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            console.error("Supabase Login Error:", error);

            let friendlyMessage = "An unexpected error occurred. Please try again.";
            
            // Handle Supabase error codes or messages
            if (error.message?.includes('Invalid login credentials') || error.code === 'invalid_credentials') {
                friendlyMessage = "Incorrect email or password. Please try again.";
            } else if (error.message?.includes('invalid email') || error.message?.includes('email format')) {
                friendlyMessage = "Please enter a valid email address.";
            } else if (error.message?.includes('rate limit') || error.status === 429) {
                friendlyMessage = "Too many failed attempts. Please try again later.";
            } else if (error.message) {
                friendlyMessage = error.message;
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
                <View style={styles.passwordContainer}>
                    <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Password" 
                        placeholderTextColor="#9CA3AF" 
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry={!showPassword} 
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
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

            <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => router.push('/auth/register')}
            >
                <Text style={styles.switchButtonText}>
                    Don't have an account? <Text style={styles.switchButtonTextBold}>Sign Up</Text>
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
    switchButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#4B5563',
        fontSize: 14,
    },
    switchButtonTextBold: {
        color: '#111827',
        fontWeight: '700',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    eyeIcon: {
        padding: 16,
    },
});
