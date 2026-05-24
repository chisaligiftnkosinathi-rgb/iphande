import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView } from 'react-native';
import { quoteToCashService, Quote, Invoice, PaymentIntent } from '../src/services/quoteToCashService';
import QuoteCard from '../components/quoteToCash/QuoteCard';
import InvoiceCard from '../components/quoteToCash/InvoiceCard';
import PaymentIntentCard from '../components/quoteToCash/PaymentIntentCard';

const QuoteToCashScreen: React.FC = () => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>(quoteToCashService.getQuotes());
  const [invoices, setInvoices] = useState<Invoice[]>(quoteToCashService.getInvoices());
  const [paymentIntents, setPaymentIntents] = useState<PaymentIntent[]>(quoteToCashService.getPaymentIntents());

  const refresh = () => {
    setQuotes([...quoteToCashService.getQuotes()]);
    setInvoices([...quoteToCashService.getInvoices()]);
    setPaymentIntents([...quoteToCashService.getPaymentIntents()]);
  };

  const handleCreateQuote = () => {
    if (!description || !amount) return;
    quoteToCashService.createQuote(description, parseFloat(amount));
    setDescription('');
    setAmount('');
    refresh();
  };

  const handleAcceptQuote = (id: string) => {
    quoteToCashService.acceptQuote(id);
    refresh();
  };

  const handleCreateInvoice = (id: string) => {
    quoteToCashService.createInvoice(id);
    refresh();
  };

  const handleCreatePaymentIntent = (id: string) => {
    quoteToCashService.createPaymentIntent(id);
    refresh();
  };

  const handleConfirmPayment = (id: string) => {
    quoteToCashService.confirmPayment(id);
    refresh();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.doctrine}>
        Simulated payment only. iPhande does not hold money or process card details.
      </Text>
      <Text style={styles.header}>Create Quote</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <Button title="Create Quote" onPress={handleCreateQuote} />
      <Text style={styles.header}>Quotes</Text>
      {quotes.map(q => (
        <QuoteCard
          key={q.id}
          quote={q}
          onAccept={() => handleAcceptQuote(q.id)}
          onCreateInvoice={() => handleCreateInvoice(q.id)}
        />
      ))}
      <Text style={styles.header}>Invoices</Text>
      {invoices.map(i => (
        <InvoiceCard
          key={i.id}
          invoice={i}
          onCreatePaymentIntent={() => handleCreatePaymentIntent(i.id)}
        />
      ))}
      <Text style={styles.header}>Payment Intents</Text>
      {paymentIntents.map(p => (
        <PaymentIntentCard
          key={p.id}
          paymentIntent={p}
          onConfirmPayment={() => handleConfirmPayment(p.id)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  doctrine: { color: 'red', marginBottom: 12, fontWeight: 'bold' },
  header: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 },
});

export default QuoteToCashScreen;
