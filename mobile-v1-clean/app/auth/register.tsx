import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            console.error("Supabase Registration Error:", error);

            let friendlyMessage = "An unexpected error occurred. Please try again.";
            
            // Handle Supabase error codes or messages
            if (error.message?.includes('already registered') || error.code === 'user_already_exists') {
                friendlyMessage = "This email already belongs to a steward. Please sign in instead.";
            } else if (error.message?.includes('invalid email') || error.message?.includes('email format')) {
                friendlyMessage = "Please enter a valid email address.";
            } else if (error.message?.includes('password') || error.code === 'weak_password') {
                friendlyMessage = "Your password must be at least 6 characters long.";
            } else if (error.message) {
                friendlyMessage = error.message; // Let the actual Supabase message show (e.g., Database error saving new user)
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

                <View style={styles.passwordContainer}>
                    <TextInput 
                        style={styles.passwordInput} 
                        placeholder="Confirm Password" 
                        placeholderTextColor="#9CA3AF" 
                        value={confirmPassword} 
                        onChangeText={setConfirmPassword} 
                        secureTextEntry={!showConfirmPassword} 
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
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

            <TouchableOpacity 
                style={styles.switchButton} 
                onPress={() => router.push('/auth/login')}
            >
                <Text style={styles.switchButtonText}>
                    Already have an account? <Text style={styles.switchButtonTextBold}>Login</Text>
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
