import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FinancialEvent, ObligationView } from '../../src/services/financialEventsService';

type Props = {
    obligationView: ObligationView;
};

export const ObligationCard: React.FC<Props> = ({ obligationView }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.kicker}>Obligation View</Text>
            <Text style={styles.total}>{formatMoney(obligationView.currency, obligationView.obligation_total)}</Text>
            <Text style={styles.subtitle}>{obligationView.obligations.length} recorded obligations</Text>
            {obligationView.obligations.slice(0, 4).map((event) => (
                <ObligationRow key={event.id} event={event} />
            ))}
            {obligationView.obligations.length === 0 && (
                <Text style={styles.empty}>No recorded debt or obligation pressure.</Text>
            )}
        </View>
    );
};

const ObligationRow: React.FC<{ event: FinancialEvent }> = ({ event }) => (
    <View style={styles.obligationRow}>
        <View style={styles.rowText}>
            <Text style={styles.description}>{event.description}</Text>
            <Text style={styles.meta}>{event.event_type.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.amount}>{formatMoney(event.currency, event.amount)}</Text>
    </View>
);

function formatMoney(currency: string, amount: string): string {
    return `${currency} ${Number(amount).toFixed(2)}`;
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#D1D5DB' },
    kicker: { fontSize: 12, fontWeight: '800', color: '#374151', textTransform: 'uppercase', marginBottom: 8 },
    total: { fontSize: 28, fontWeight: '900', color: '#7F1D1D' },
    subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 12 },
    obligationRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    rowText: { flex: 1 },
    description: { fontSize: 13, fontWeight: '700', color: '#111827' },
    meta: { fontSize: 11, color: '#6B7280', marginTop: 3, textTransform: 'uppercase' },
    amount: { fontSize: 13, fontWeight: '900', color: '#111827' },
    empty: { marginTop: 4, fontSize: 13, color: '#6B7280' },
});
