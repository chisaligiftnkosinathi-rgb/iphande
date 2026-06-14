import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { useAuth } from '../src/auth/AuthContext';
import { getCommissionLedger } from '../src/services/apiClient';
import type { CommissionLedgerResponse } from '../src/types/api';

export const CommissionLedgerScreen = () => {
    const { stewardId } = useAuth() as any;
    const [ledger, setLedger] = useState<CommissionLedgerResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLedger = async () => {
        if (!stewardId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getCommissionLedger(stewardId);
            setLedger(data);
        } catch (err: any) {
            setError(err.message || 'Failed to reconstruct commission ledger.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLedger();
    }, [loadLedger, stewardId]);

    if (loading) {
        return (
            <View style={{ flex: 1 }}>
                <AppHeader title="Commission Ledger" />
                <View style={[styles.screen, styles.center]}>
                    <ActivityIndicator size="large" color="#166534" />
                </View>
            </View>
        );
    }

    if (error || !ledger) {
        return (
            <View style={{ flex: 1 }}>
                <AppHeader title="Commission Ledger" />
                <View style={[styles.screen, styles.center]}>
                    <Text style={styles.errorText}>{error || 'Ledger unavailable'}</Text>
                    <TouchableOpacity onPress={loadLedger} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const { pipeline, cashReality, truthBoundary } = ledger;

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Commission Ledger" />
            <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
                <View style={styles.headerCard}>
                    <Text style={styles.eyebrow}>Economic Continuity</Text>
                    <Text style={styles.header}>Commission Ledger</Text>
                    <Text style={styles.owner}>Steward: {stewardId}</Text>
                </View>

                <View style={styles.ruleCard}>
                    <Text style={styles.ruleTitle}>System Commission Rule</Text>
                    <Text style={styles.ruleText}>
                        Suggested setup contribution = ZAR 120. Commission is only recorded after verified sale evidence. No sale = no commission.
                    </Text>
                </View>

                <View style={styles.pipelineCard}>
                    <Text style={styles.sectionTitlePipeline}>Pipeline (Opportunity)</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Active Leads</Text>
                        <Text style={styles.value}>{pipeline.activeLeads}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Quotes Drafted</Text>
                        <Text style={styles.value}>{pipeline.quotesDrafted}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Applications Pending</Text>
                        <Text style={styles.value}>{pipeline.applicationsPending}</Text>
                    </View>
                    <View style={[styles.row, styles.highlightRowPipeline]}>
                        <Text style={styles.highlightLabel}>Expected Commission</Text>
                        <Text style={styles.highlightValuePipeline}>{pipeline.expectedCommission}</Text>
                    </View>
                </View>

                <View style={styles.cashCard}>
                    <Text style={styles.sectionTitleCash}>Cash Reality</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Commission Approved</Text>
                        <Text style={styles.value}>{cashReality.commissionApproved}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Commission Paid</Text>
                        <Text style={styles.value}>{cashReality.commissionPaid}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Commission Clawed Back</Text>
                        <Text style={[styles.value, { color: '#B91C1C' }]}>{cashReality.commissionClawedBack}</Text>
                    </View>
                    <View style={[styles.row, styles.highlightRowCash]}>
                        <Text style={styles.highlightLabelCash}>Available Cash</Text>
                        <Text style={styles.highlightValueCash}>{cashReality.availableCash}</Text>
                    </View>
                </View>

                <View style={styles.boundaryCard}>
                    <Text style={styles.boundaryTitle}>Truth Boundary</Text>
                    <Text style={styles.boundaryText}>{truthBoundary}</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    center: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20, gap: 16 },
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 18, borderWidth: 1, borderColor: '#E5E7EB' },
    eyebrow: { fontSize: 12, fontWeight: '900', color: '#2F6B4F', textTransform: 'uppercase', marginBottom: 6 },
    header: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 8 },
    owner: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
    ruleCard: { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 16 },
    ruleTitle: { fontSize: 13, fontWeight: '900', color: '#1E40AF', textTransform: 'uppercase', marginBottom: 6 },
    ruleText: { fontSize: 12, lineHeight: 18, color: '#1D4ED8', fontWeight: '800' },
    pipelineCard: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 18, borderWidth: 1, borderColor: '#E5E7EB' },
    cashCard: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 18, borderWidth: 1, borderColor: '#BBF7D0' },
    sectionTitlePipeline: { fontSize: 16, fontWeight: '900', color: '#374151', textTransform: 'uppercase', marginBottom: 12 },
    sectionTitleCash: { fontSize: 16, fontWeight: '900', color: '#166534', textTransform: 'uppercase', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    label: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    value: { fontSize: 14, color: '#111827', fontWeight: '800' },
    highlightRowPipeline: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    highlightRowCash: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#BBF7D0' },
    highlightLabel: { fontSize: 14, color: '#374151', fontWeight: '900' },
    highlightLabelCash: { fontSize: 14, color: '#14532D', fontWeight: '900' },
    highlightValuePipeline: { fontSize: 16, color: '#D97706', fontWeight: '900' }, // Amber for "not quite there"
    highlightValueCash: { fontSize: 16, color: '#15803D', fontWeight: '900' }, // Green for "real money"
    boundaryCard: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#FCA5A5', marginTop: 8, marginBottom: 20 },
    boundaryTitle: { fontSize: 13, fontWeight: '900', color: '#991B1B', textTransform: 'uppercase', marginBottom: 6 },
    boundaryText: { fontSize: 12, lineHeight: 18, color: '#B91C1C', fontWeight: '800' },
    errorText: { color: '#B91C1C', fontSize: 14, fontWeight: '700', marginBottom: 12 },
    retryButton: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
    retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
