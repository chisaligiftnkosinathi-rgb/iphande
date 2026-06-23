import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Invoice } from '../../src/services/quoteToCashService';

type Props = {
  invoice: Invoice;
  onCreatePaymentIntent: () => void;
};

const InvoiceCard: React.FC<Props> = ({ invoice, onCreatePaymentIntent }) => (
  <View style={styles.card}>
    <Text style={styles.title}>Invoice</Text>
    <Text>Amount: R{invoice.amount.toFixed(2)}</Text>
    <Text>Status: {invoice.status}</Text>
    {invoice.status === 'pending' && <Button title="Create Payment Intent" onPress={onCreatePaymentIntent} />}
    {invoice.status === 'paid' && <Text style={styles.paid}>Paid</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#f1f1f1', padding: 12, borderRadius: 8, marginBottom: 10 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  paid: { color: 'green', fontWeight: 'bold', marginTop: 4 },
});

export default InvoiceCard;
