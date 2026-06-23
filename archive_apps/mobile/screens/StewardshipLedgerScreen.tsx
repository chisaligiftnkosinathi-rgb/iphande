import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CashReplayCard } from '../components/stewardship/CashReplayCard';
import { ObligationCard } from '../components/stewardship/ObligationCard';
import { ProfitSnapshotCard } from '../components/stewardship/ProfitSnapshotCard';
import { DEMO_BUSINESS_OWNER_ID } from '../src/config/demoIdentity';
import {
    CashReplay,
    fetchCashReplay,
    fetchObligations,
    fetchProfitSnapshot,
    ObligationView,
    ProfitSnapshot,
} from '../src/services/financialEventsService';

const StewardshipLedgerScreen: React.FC = () => {
    const [cashReplay, setCashReplay] = useState<CashReplay | null>(null);
    const [profitSnapshot, setProfitSnapshot] = useState<ProfitSnapshot | null>(null);
    const [obligationView, setObligationView] = useState<ObligationView | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        loadStewardshipReports();
    }, []);

    const loadStewardshipReports = async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const [cash, profit, obligations] = await Promise.all([
                fetchCashReplay(DEMO_BUSINESS_OWNER_ID),
                fetchProfitSnapshot(DEMO_BUSINESS_OWNER_ID),
                fetchObligations(DEMO_BUSINESS_OWNER_ID),
            ]);
            setCashReplay(cash);
            setProfitSnapshot(profit);
            setObligationView(obligations);
        } catch (error) {
            console.error('Failed to load stewardship ledger', error);
            setErrorMessage('Stewardship reports could not be loaded from the configured API.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.banner}>
                <Text style={styles.bannerTitle}>Stewardship Ledger</Text>
                <Text style={styles.bannerText}>
                    This view helps you observe money movement. It does not provide financial advice or predict success.
                </Text>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1E3A2F" />
                    <Text style={styles.loadingText}>Loading stewardship reports...</Text>
                </View>
            ) : errorMessage ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Reports unavailable</Text>
                    <Text style={styles.emptyText}>{errorMessage}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadStewardshipReports}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View>
                    {cashReplay && (
                        <View style={styles.reportSection}>
                            <CashReplayCard cashReplay={cashReplay} />
                        </View>
                    )}
                    {profitSnapshot && (
                        <View style={styles.reportSection}>
                            <ProfitSnapshotCard profitSnapshot={profitSnapshot} />
                        </View>
                    )}
                    {obligationView && (
                        <View style={styles.reportSection}>
                            <ObligationCard obligationView={obligationView} />
                        </View>
                    )}
                    {cashReplay?.events.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No money events recorded</Text>
                            <Text style={styles.emptyText}>Cash, profit, and obligations will appear here after financial events are recorded.</Text>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 16 },
    banner: { backgroundColor: '#111827', borderRadius: 8, padding: 16 },
    bannerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
    bannerText: { fontSize: 13, lineHeight: 19, color: '#D1D5DB' },
    center: { minHeight: 220, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 13, color: '#6B7280' },
    reportSection: { marginBottom: 12 },
    emptyState: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 18, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 6 },
    emptyText: { fontSize: 13, lineHeight: 19, color: '#6B7280', textAlign: 'center' },
    retryButton: { marginTop: 12, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
    retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});

export default StewardshipLedgerScreen;
