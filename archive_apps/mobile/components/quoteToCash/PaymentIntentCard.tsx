import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { PaymentIntent } from '../../src/services/quoteToCashService';

type Props = {
  paymentIntent: PaymentIntent;
  onConfirmPayment: () => void;
};

const PaymentIntentCard: React.FC<Props> = ({ paymentIntent, onConfirmPayment }) => (
  <View style={styles.card}>
    <Text style={styles.title}>Payment Intent</Text>
    <Text>Amount: R{paymentIntent.amount.toFixed(2)}</Text>
    <Text>Status: {paymentIntent.status}</Text>
    {paymentIntent.status === 'pending' && <Button title="Confirm Payment (Simulated)" onPress={onConfirmPayment} />}
    {paymentIntent.status === 'confirmed' && <Text style={styles.confirmed}>Payment Confirmed</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#e9e9e9', padding: 12, borderRadius: 8, marginBottom: 10 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  confirmed: { color: 'blue', fontWeight: 'bold', marginTop: 4 },
});

export default PaymentIntentCard;
