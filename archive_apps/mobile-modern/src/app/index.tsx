import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSteward } from '../context/StewardContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, steward, signOut } = useSteward();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.authRow}>
        {isAuthenticated ? (
          <TouchableOpacity onPress={signOut} style={styles.authButton}>
            <Text style={styles.authButtonText}>Sign Out ({user?.email})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/auth')} style={styles.authButton}>
            <Text style={styles.authButtonText}>Sign In as Steward</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.title}>Welcome, Steward.</Text>
        <Text style={styles.subtitle}>Your work matters here.</Text>
        <Text style={styles.traceText}>Every act of service leaves a trace.</Text>
      </View>

      <View style={styles.pathsSection}>
        {isAuthenticated ? (
          steward ? (
            <>
              <TouchableOpacity style={styles.pathCard} onPress={() => router.push('/profile/visibility')}>
                <Text style={styles.pathTitle}>My Visibility</Text>
                <Text style={styles.pathDescription}>I am seen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.pathCard} onPress={() => router.push('/onboarding')}>
              <Text style={styles.pathTitle}>Establish Identity</Text>
              <Text style={styles.pathDescription}>Set up your steward profile</Text>
            </TouchableOpacity>
          )
        ) : (
          <Text style={styles.guestText}>Please sign in to access your stewardship tools.</Text>
        )}

        <TouchableOpacity style={styles.pathCard} onPress={() => router.push('/business/mandla-auto')}>
          <Text style={styles.pathTitle}>View Business Profile</Text>
          <Text style={styles.pathDescription}>Others can find me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pathCard} onPress={() => Alert.alert('Coming Soon', 'This page will be available after V1 launch.')}>
          <Text style={styles.pathTitle}>Help</Text>
          <Text style={styles.pathDescription}>Learn how to use iPhande</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pathCard} onPress={() => Alert.alert('Coming Soon', 'This page will be available after V1 launch.')}>
          <Text style={styles.pathTitle}>About iPhande</Text>
          <Text style={styles.pathDescription}>The purpose of the system</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pathCard} onPress={() => Alert.alert('Coming Soon', 'This page will be available after V1 launch.')}>
          <Text style={styles.pathTitle}>Contact</Text>
          <Text style={styles.pathDescription}>Get in touch with us</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EA' },
  contentContainer: { padding: 24, maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 60 },
  authRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 },
  authButton: { backgroundColor: '#E8DFD0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  authButtonText: { color: '#24352F', fontSize: 14, fontWeight: '600' },
  welcomeSection: { marginBottom: 48, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#24352F', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 20, color: '#5D7A5A', fontStyle: 'italic', marginBottom: 8, textAlign: 'center' },
  traceText: { fontSize: 16, color: '#6F7D75', textAlign: 'center' },
  pathsSection: { gap: 16 },
  pathCard: { backgroundColor: '#FFFDF8', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#E8DFD0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' },
  pathTitle: { fontSize: 20, fontWeight: '700', color: '#24352F', marginBottom: 6 },
  pathDescription: { fontSize: 15, color: '#6F7D75', fontStyle: 'italic' },
  guestText: { textAlign: 'center', color: '#6F7D75', fontSize: 16, fontStyle: 'italic', marginBottom: 16 },
});
