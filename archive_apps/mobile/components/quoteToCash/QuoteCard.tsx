import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Quote } from '../../src/services/quoteToCashService';

type Props = {
  quote: Quote;
  onAccept: () => void;
  onCreateInvoice: () => void;
};

const QuoteCard: React.FC<Props> = ({ quote, onAccept, onCreateInvoice }) => (
  <View style={styles.card}>
    <Text style={styles.title}>Quote: {quote.description}</Text>
    <Text>Amount: R{quote.amount.toFixed(2)}</Text>
    <Text>Status: {quote.status}</Text>
    {quote.status === 'created' && <Button title="Accept Quote" onPress={onAccept} />}
    {quote.status === 'accepted' && <Button title="Create Invoice + Demo Payment" onPress={onCreateInvoice} />}
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 10 },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
});

export default QuoteCard;
