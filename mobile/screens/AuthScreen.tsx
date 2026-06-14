import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StewardButton } from '../components/ui/StewardButton';
import { useAuth } from '../src/auth/AuthContext';
import theme from '../theme';

const AuthScreen: React.FC = () => {
    const { signIn, signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Default mode is signUp
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleAuth = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            if (mode === 'signIn') {
                await signIn(email, password);
            } else {
                await signUp(email, password);
                setSuccess('Verification email sent. Please verify before onboarding.');
            }
        } catch (e: any) {
            setError(e.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to iPhande</Text>
            <Text style={styles.subtitle}>Give your business a real home online.</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            {success && <Text style={styles.success}>{success}</Text>}
            <StewardButton
                title={mode === 'signIn' ? 'Sign In' : 'Create Business Account'}
                variant="primary"
                onPress={handleAuth}
                style={styles.button}
                disabled={loading}
            />
            {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
            <TouchableOpacity onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
                <Text style={styles.switchText}>
                    {mode === 'signIn'
                        ? "Don't have an account? Create Business Account"
                        : 'Already have an account? Sign In'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.humanSpace.background,
        padding: theme.layout.spacing.xxl,
    },
    title: {
        ...theme.typography.display,
        marginBottom: theme.layout.spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        ...theme.typography.body,
        marginBottom: theme.layout.spacing.xxl,
        textAlign: 'center',
        color: theme.colors.structural.slate,
    },
    input: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        marginBottom: theme.layout.spacing.md,
        fontSize: 16,
    },
    button: {
        width: '100%',
        maxWidth: 340,
        marginTop: theme.layout.spacing.md,
    },
    error: {
        color: '#B91C1C',
        marginBottom: 8,
        textAlign: 'center',
    },
    success: {
        color: 'green',
        marginBottom: 8,
        textAlign: 'center',
    },
    switchText: {
        color: '#2563EB',
        marginTop: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default AuthScreen;
