import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CashReplay } from '../../src/services/financialEventsService';

type Props = {
    cashReplay: CashReplay;
};

export const CashReplayCard: React.FC<Props> = ({ cashReplay }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.kicker}>Cash Replay</Text>
            <View style={styles.row}>
                <View>
                    <Text style={styles.label}>Cash In</Text>
                    <Text style={styles.value}>{formatMoney(cashReplay.currency, cashReplay.inflow_total)}</Text>
                </View>
                <View style={styles.alignRight}>
                    <Text style={styles.label}>Cash Out</Text>
                    <Text style={styles.value}>{formatMoney(cashReplay.currency, cashReplay.outflow_total)}</Text>
                </View>
            </View>
            <View style={styles.netBox}>
                <Text style={styles.label}>Net Cash Movement</Text>
                <Text style={styles.netValue}>{formatMoney(cashReplay.currency, cashReplay.net_cash)}</Text>
            </View>
            <Text style={styles.footnote}>{cashReplay.events.length} recorded money events</Text>
        </View>
    );
};

function formatMoney(currency: string, amount: string): string {
    return `${currency} ${Number(amount).toFixed(2)}`;
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#D1D5DB' },
    kicker: { fontSize: 12, fontWeight: '800', color: '#374151', textTransform: 'uppercase', marginBottom: 14 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    label: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    value: { fontSize: 19, fontWeight: '800', color: '#111827' },
    alignRight: { alignItems: 'flex-end' },
    netBox: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    netValue: { fontSize: 26, fontWeight: '900', color: '#14532D' },
    footnote: { marginTop: 10, fontSize: 12, color: '#6B7280' },
});
