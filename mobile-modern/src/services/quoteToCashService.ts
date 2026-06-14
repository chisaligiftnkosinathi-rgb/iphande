// Service for Quote-to-Cash business flow
// Simulates quote creation, acceptance, invoice, and payment intent

export type Quote = {
  id: string;
  description: string;
  amount: number;
  status: 'created' | 'accepted' | 'invoiced' | 'paid';
};

export type Invoice = {
  id: string;
  quoteId: string;
  amount: number;
  status: 'pending' | 'paid';
};

export type PaymentIntent = {
  id: string;
  invoiceId: string;
  amount: number;
  status: 'pending' | 'confirmed';
};

// In-memory store for demo
const quotes: Quote[] = [];
const invoices: Invoice[] = [];
const paymentIntents: PaymentIntent[] = [];

export const quoteToCashService = {
  createQuote(description: string, amount: number): Quote {
    const quote: Quote = {
      id: Date.now().toString(),
      description,
      amount,
      status: 'created',
    };
    quotes.push(quote);
    return quote;
  },
  acceptQuote(quoteId: string): Quote | undefined {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote && quote.status === 'created') {
      quote.status = 'accepted';
      return quote;
    }
    return undefined;
  },
  createInvoice(quoteId: string): Invoice | undefined {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote && quote.status === 'accepted') {
      quote.status = 'invoiced';
      const invoice: Invoice = {
        id: (Date.now() + 1).toString(),
        quoteId,
        amount: quote.amount,
        status: 'pending',
      };
      invoices.push(invoice);
      return invoice;
    }
    return undefined;
  },
  createPaymentIntent(invoiceId: string): PaymentIntent | undefined {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice && invoice.status === 'pending') {
      const paymentIntent: PaymentIntent = {
        id: (Date.now() + 2).toString(),
        invoiceId,
        amount: invoice.amount,
        status: 'pending',
      };
      paymentIntents.push(paymentIntent);
      return paymentIntent;
    }
    return undefined;
  },
  confirmPayment(paymentIntentId: string): PaymentIntent | undefined {
    const paymentIntent = paymentIntents.find(p => p.id === paymentIntentId);
    if (paymentIntent && paymentIntent.status === 'pending') {
      paymentIntent.status = 'confirmed';
      const invoice = invoices.find(i => i.id === paymentIntent.invoiceId);
      if (invoice) invoice.status = 'paid';
      const quote = quotes.find(q => q.id === invoice?.quoteId);
      if (quote) quote.status = 'paid';
      return paymentIntent;
    }
    return undefined;
  },
  getQuotes() {
    return quotes;
  },
  getInvoices() {
    return invoices;
  },
  getPaymentIntents() {
    return paymentIntents;
  },
};
