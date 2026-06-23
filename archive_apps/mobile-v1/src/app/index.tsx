import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>iP</Text>
        </View>

        <Text style={styles.brand}>iPhande</Text>
        <Text style={styles.title}>Make your work visible.</Text>
        <Text style={styles.subtitle}>Build trust through real service.</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/onboarding')}>
            <Text style={styles.primaryButtonText}>Register Business</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/auth')}>
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/profile/visibility')}>
            <Text style={styles.secondaryButtonText}>My Visibility</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/leads/capture')}>
            <Text style={styles.secondaryButtonText}>Capture Lead</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/explore')}>
            <Text style={styles.linkButtonText}>Explore Businesses</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Visibility • Trust • Continuity</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EA' },
  safeArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#24352F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoText: { color: '#FFFDF8', fontSize: 28, fontWeight: '900' },
  brand: { fontSize: 34, fontWeight: '900', color: '#24352F', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#24352F', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6F7D75', marginTop: 8, marginBottom: 34, textAlign: 'center' },
  actions: { width: '100%', maxWidth: 360, gap: 12 },
  primaryButton: { backgroundColor: '#24352F', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFDF8', fontSize: 16, fontWeight: '800' },
  secondaryButton: { backgroundColor: '#FFFDF8', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD0' },
  secondaryButtonText: { color: '#24352F', fontSize: 16, fontWeight: '800' },
  linkButton: { padding: 12, alignItems: 'center' },
  linkButtonText: { color: '#5D7A5A', fontSize: 15, fontWeight: '700' },
  footer: { marginTop: 34, color: '#6F7D75', fontSize: 13 },
});
