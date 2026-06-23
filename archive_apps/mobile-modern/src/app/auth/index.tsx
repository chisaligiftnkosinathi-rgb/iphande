import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSteward } from '../../context/StewardContext';

export default function AuthScreen() {
  const { signIn, signUp, user, emailVerified, refreshUser, signOut } = useSteward();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // If fully authenticated and verified, return to the doorway
    if (user && emailVerified) {
      router.replace('/');
    }
  }, [user, emailVerified, router]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setSuccessMsg('Verification email sent. Please verify your email, then click below.');
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshUser();
    } catch (e: any) {
      setError(e.message || 'Failed to refresh verification status.');
    } finally {
      setLoading(false);
    }
  };

  // The Verification Wall
  if (user && !emailVerified) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>Please verify your email first to access private stewardship tools.</Text>

          {successMsg && <Text style={[styles.errorText, { color: '#5D7A5A' }]}>{successMsg}</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleRefresh} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>I have verified my email</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleButton} onPress={signOut}>
            <Text style={styles.toggleText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Welcome back, Steward.' : 'Begin your journey as a Steward.'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {successMsg && <Text style={[styles.errorText, { color: '#5D7A5A' }]}>{successMsg}</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleButton} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EA', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFDF8', padding: 32, borderRadius: 12, borderWidth: 1, borderColor: '#E8DFD0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, maxWidth: 400, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#24352F', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6F7D75', fontStyle: 'italic', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  errorText: { color: 'red', marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#24352F', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  toggleButton: { marginTop: 24, alignItems: 'center' },
  toggleText: { color: '#5D7A5A', fontSize: 15, fontWeight: '600' }
});
