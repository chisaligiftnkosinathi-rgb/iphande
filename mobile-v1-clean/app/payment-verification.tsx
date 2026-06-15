import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWithAuth } from '../src/config/api';
import { useSteward } from '../src/context/StewardContext';

export default function PaymentVerificationScreen() {
  const router = useRouter();
  const { refreshProfile } = useSteward();
  const [status, setStatus] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/profiles/me/payment-status');
      setStatus(res.setup_fee_status);
      setIsVerified(res.is_verified);
      setReviewNote(res.setup_fee_review_note);
    } catch (err: any) {
      console.warn('Payment-status route failed or 404, falling back to /profiles/me', err);
      try {
        const profileRes = await fetchWithAuth('/profiles/me');
        setStatus(profileRes.setup_fee_status);
        setIsVerified(profileRes.is_verified);
        setReviewNote(profileRes.setup_fee_review_note);
      } catch (fallbackErr) {
        console.error('Failed to fetch profile fallback', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitProof = async () => {
    if (!proofUrl.trim()) {
      Alert.alert('Required', 'Please enter a valid proof URL or reference.');
      return;
    }
    try {
      setLoading(true);
      await fetchWithAuth('/profiles/me/payment-proof', {
          method: 'POST',
          body: JSON.stringify({ proof_url: proofUrl })
      });
      await refreshProfile();
      Alert.alert('Success', 'Proof of payment submitted. Waiting for admin approval.');
      await fetchStatus();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit proof.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading verification status...</Text>
      </View>
    );
  }

  if (isVerified || status === 'approved') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Account Verified</Text>
        <Text style={styles.text}>Your account is fully verified. You can now access all iPhande tools.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/tabs/index')}>
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Become a Verified Steward</Text>
      <Text style={styles.description}>
        To unlock Trust Verification, Quotes, Invoices, Proof of Work, and your official Business Timeline,
        a once-off lifetime verification fee of R120 is required.
      </Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Current Status: <Text style={[{
            color: status === 'approved' ? '#4ade80' : status === 'rejected' ? '#ef4444' : status === 'pending_review' ? '#facc15' : '#aaa',
        }]}>{status?.replace('_', ' ').toUpperCase() || 'NOT SUBMITTED'}</Text></Text>
        {status === 'rejected' && reviewNote && (
          <Text style={styles.errorText}>Reason: {reviewNote}</Text>
        )}
      </View>

      <View style={styles.bankDetails}>
        <Text style={styles.bankTitle}>Bank Details</Text>
        <Text style={styles.text}>Bank: FNB</Text>
        <Text style={styles.text}>Account: 62001122334</Text>
        <Text style={styles.text}>Branch: 250655</Text>
        <Text style={styles.text}>Reference: [Your Phone Number]</Text>
      </View>

      {(status === 'not_submitted' || status === 'rejected') && (
        <View style={styles.form}>
          <Text style={styles.label}>Upload Proof of Payment (URL)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Google Drive link or Transaction ID"
            value={proofUrl}
            onChangeText={setProofUrl}
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.button} onPress={submitProof}>
            <Text style={styles.buttonText}>Submit Proof</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'pending_review' && (
        <View style={styles.form}>
          <Text style={styles.description}>
            Your proof has been received and is waiting for admin approval. This usually takes less than 24 hours.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()}>
        <Text style={styles.outlineButtonText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F9FAFB' },
  scrollContainer: { padding: 24, backgroundColor: '#F9FAFB', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 16, color: '#4B5563', marginBottom: 24, textAlign: 'center', lineHeight: 24 },
  statusBox: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  statusLabel: { color: '#111827', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#ef4444', marginTop: 8, fontSize: 14 },
  bankDetails: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  bankTitle: { color: '#111827', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  text: { color: '#4B5563', fontSize: 16, marginBottom: 6 },
  form: { marginBottom: 20 },
  label: { color: '#374151', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: '#FFFFFF', color: '#111827', padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#D1D5DB' },
  button: { backgroundColor: '#111827', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  outlineButton: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', marginTop: 10 },
  outlineButtonText: { color: '#4B5563', fontSize: 16, fontWeight: '700' },
});
