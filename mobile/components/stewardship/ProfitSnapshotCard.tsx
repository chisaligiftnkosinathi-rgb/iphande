import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ProfitSnapshot } from '../../src/services/financialEventsService';

type Props = {
    profitSnapshot: ProfitSnapshot;
};

export const ProfitSnapshotCard: React.FC<Props> = ({ profitSnapshot }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.kicker}>Profit Snapshot</Text>
            <View style={styles.metricRow}>
                <Text style={styles.label}>Income</Text>
                <Text style={styles.value}>{formatMoney(profitSnapshot.currency, profitSnapshot.income_total)}</Text>
            </View>
            <View style={styles.metricRow}>
                <Text style={styles.label}>Expenses</Text>
                <Text style={styles.value}>{formatMoney(profitSnapshot.currency, profitSnapshot.expense_total)}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Observed Profit</Text>
                <Text style={styles.totalValue}>{formatMoney(profitSnapshot.currency, profitSnapshot.profit)}</Text>
            </View>
        </View>
    );
};

function formatMoney(currency: string, amount: string): string {
    return `${currency} ${Number(amount).toFixed(2)}`;
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#D1D5DB' },
    kicker: { fontSize: 12, fontWeight: '800', color: '#374151', textTransform: 'uppercase', marginBottom: 10 },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    label: { fontSize: 14, color: '#4B5563' },
    value: { fontSize: 14, fontWeight: '800', color: '#111827' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    totalLabel: { fontSize: 15, fontWeight: '800', color: '#111827' },
    totalValue: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
});
