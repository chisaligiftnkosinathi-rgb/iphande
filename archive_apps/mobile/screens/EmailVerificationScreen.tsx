import { reload, sendEmailVerification, signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { auth } from '../src/config/firebase';

interface Props {
    onRefresh: () => void;
}

const EmailVerificationScreen: React.FC<Props> = ({ onRefresh }) => {
    const user = auth.currentUser;
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleResend = async () => {
        if (!user) return;
        setSending(true);
        setError(null);
        try {
            await sendEmailVerification(user);
            setSent(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSending(false);
        }
    };

    const handleRefresh = async () => {
        if (!user) return;
        setError(null);
        try {
            await reload(user);
            onRefresh();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.text}>
                A verification link has been sent to your email. Please verify your email to continue.
            </Text>
            {sent && <Text style={styles.success}>Verification email sent!</Text>}
            {error && <Text style={styles.error}>{error}</Text>}
            <Button title="Resend verification email" onPress={handleResend} disabled={sending} />
            <Button title="Refresh verification status" onPress={handleRefresh} />
            <Button title="Sign out" onPress={handleSignOut} color="#B91C1C" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    text: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
    success: { color: 'green', marginBottom: 8 },
    error: { color: 'red', marginBottom: 8 },
});

export default EmailVerificationScreen;
