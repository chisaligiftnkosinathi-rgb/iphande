import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';

export default function AdminPaymentReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/admin/payment-reviews');
      setReviews(data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch payment reviews.');
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (profileId: string) => {
    try {
      await fetchWithAuth(`/admin/payment-reviews/${profileId}/approve`, { method: 'POST' });
      Alert.alert('Approved', 'Steward has been granted full platform access.');
      fetchReviews();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to approve payment.');
    }
  };

  const rejectPayment = async (profileId: string) => {
    // Basic prompt alternative since React Native Prompt is not standard on Android
    const reason = 'Invalid proof provided. Please upload a clear bank document.';
    try {
      await fetchWithAuth(`/admin/payment-reviews/${profileId}/reject`, {
          method: 'POST',
          body: JSON.stringify({ review_note: reason })
      });
      Alert.alert('Rejected', 'Steward has been rejected and notified.');
      fetchReviews();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to reject payment.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name} ({item.business_name || 'No Business'})</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.proofText}>Proof: {item.setup_fee_proof_url}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.button, styles.approveBtn]} onPress={() => approvePayment(item.profile_id)}>
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.rejectBtn]} onPress={() => rejectPayment(item.profile_id)}>
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending R120 Reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>No pending payment reviews.</Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.profile_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20 },
  centered: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  header: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  emptyText: { color: '#aaa', fontSize: 16, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#222', padding: 15, borderRadius: 8, marginBottom: 15 },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  email: { color: '#ccc', fontSize: 14, marginBottom: 5 },
  proofText: { color: '#4ade80', fontSize: 14, marginVertical: 10 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  approveBtn: { backgroundColor: '#4ade80' },
  rejectBtn: { backgroundColor: '#ef4444' },
  buttonText: { color: '#111', fontWeight: 'bold', fontSize: 16 },
});
