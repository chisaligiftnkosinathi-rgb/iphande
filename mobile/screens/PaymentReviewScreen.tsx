import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { RootTabParamList } from '../navigation';
import { DEMO_BUSINESS_OWNER_ID } from '../src/config/demoIdentity';
import {
    issueReceipt,
    listPaymentIntentsForBusiness,
    rejectPaymentIntent,
    verifyPaymentIntent,
} from '../src/services/apiClient';
import type { PaymentIntentReview } from '../src/types/api';

type PaymentReviewNavigation = {
    navigate: <Name extends keyof RootTabParamList>(
        name: Name,
        params?: RootTabParamList[Name]
    ) => void;
};

const paymentStatusLabels: Record<string, string> = {
    evidence_awaiting: 'Awaiting proof',
    evidence_submitted: 'Proof submitted',
    under_review: 'Awaiting steward review',
    verified: 'Payment verified',
    rejected: 'Payment rejected',
    pending: 'Pending',
    confirmed: 'Confirmed',
    failed: 'Failed',
};

const evidenceLabels: Record<string, string> = {
    submitted: 'Proof submitted',
    evidence_check_passed: 'Evidence check passed',
    evidence_check_failed: 'Evidence check failed',
};

const PaymentReviewScreen: React.FC = () => {
    const navigation = useNavigation<PaymentReviewNavigation>();
    const [payments, setPayments] = useState<PaymentIntentReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listPaymentIntentsForBusiness(DEMO_BUSINESS_OWNER_ID);
            setPayments(data);
        } catch (err: any) {
            setError(err.message || 'Unable to load payment review items.');
            setPayments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    const onRefresh = () => {
        setRefreshing(true);
        loadPayments();
    };

    const updatePayment = (updated: PaymentIntentReview) => {
        setPayments((current) =>
            current.map((payment) =>
                payment.payment_intent_id === updated.payment_intent_id ? updated : payment
            )
        );
    };

    const runAction = async (
        paymentId: string,
        action: (id: string) => Promise<PaymentIntentReview>
    ) => {
        try {
            setBusyId(paymentId);
            setError(null);
            const updated = await action(paymentId);
            updatePayment(updated);
            await loadPayments();
        } catch (err: any) {
            setError(err.message || 'Payment review action failed.');
        } finally {
            setBusyId(null);
        }
    };

    const renderPayment = (payment: PaymentIntentReview) => {
        const isBusy = busyId === payment.payment_intent_id;
        const canReview = payment.status === 'under_review';
        const canIssueReceipt = payment.status === 'verified' && !payment.receipt_number;
        const amount = `${payment.currency} ${payment.amount}`;
        const evidenceLabel = payment.evidence_status
            ? evidenceLabels[payment.evidence_status] || payment.evidence_status
            : 'No proof submitted';

        return (
            <View key={payment.payment_intent_id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.customer}>{payment.customer_name || 'Customer'}</Text>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusText}>
                            {paymentStatusLabels[payment.status] || payment.status}
                        </Text>
                    </View>
                </View>

                <Text style={styles.amount}>{amount}</Text>
                <Text style={styles.meta}>Quote: {payment.quote_id}</Text>
                {payment.quote_request_id ? (
                    <Text style={styles.meta}>Request: {payment.quote_request_id}</Text>
                ) : null}
                <Text style={styles.meta}>Reference: {payment.payment_reference}</Text>

                <View style={styles.evidenceBox}>
                    <Text style={styles.evidenceTitle}>Evidence</Text>
                    <Text style={styles.evidenceText}>{evidenceLabel}</Text>
                    <Text style={styles.meta}>File: {payment.latest_proof_file_name || 'none'}</Text>
                    <Text style={styles.meta}>Extracted ref: {payment.extracted_reference || 'none'}</Text>
                    {payment.evidence_notes ? (
                        <Text style={styles.meta}>Notes: {payment.evidence_notes}</Text>
                    ) : null}
                </View>

                {payment.receipt_number ? (
                    <View style={styles.receiptBox}>
                        <Text style={styles.receiptText}>Receipt issued: {payment.receipt_number}</Text>
                    </View>
                ) : null}

                <View style={styles.actionRow}>
                    <Pressable
                        style={[styles.actionButton, !canReview && styles.disabledButton]}
                        disabled={!canReview || isBusy}
                        onPress={() => runAction(payment.payment_intent_id, verifyPaymentIntent)}
                    >
                        <Text style={styles.actionText}>Verify</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, styles.rejectButton, !canReview && styles.disabledButton]}
                        disabled={!canReview || isBusy}
                        onPress={() => runAction(payment.payment_intent_id, rejectPaymentIntent)}
                    >
                        <Text style={styles.actionText}>Reject</Text>
                    </Pressable>
                </View>

                <View style={styles.actionRow}>
                    <Pressable
                        style={[styles.actionButton, styles.receiptButton, !canIssueReceipt && styles.disabledButton]}
                        disabled={!canIssueReceipt || isBusy}
                        onPress={() => runAction(payment.payment_intent_id, issueReceipt)}
                    >
                        <Text style={styles.actionText}>Issue Receipt</Text>
                    </Pressable>
                    <Pressable
                        style={styles.replayButton}
                        onPress={() =>
                            navigation.navigate('EntityReplay', {
                                entityId: payment.payment_intent_id,
                                entityType: 'payment_intent',
                            })
                        }
                    >
                        <Text style={styles.replayText}>Open Replay</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.headerCard}>
                <Text style={styles.eyebrow}>Payment Stewardship</Text>
                <Text style={styles.header}>Payment Review</Text>
                <Text style={styles.description}>
                    Proof supports review. Only steward verification can mark payment as verified.
                </Text>
                <Text style={styles.owner}>Owner: {DEMO_BUSINESS_OWNER_ID}</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loading ? (
                <ActivityIndicator size="large" color="#1E3A2F" style={{ marginTop: 40 }} />
            ) : payments.length === 0 ? (
                <Text style={styles.empty}>No payment evidence is awaiting review.</Text>
            ) : (
                payments.map(renderPayment)
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 14 },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    eyebrow: { fontSize: 12, fontWeight: '900', color: '#2F6B4F', textTransform: 'uppercase', marginBottom: 6 },
    header: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 8 },
    description: { fontSize: 14, lineHeight: 22, color: '#4B5563', marginBottom: 10 },
    owner: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    customer: { fontSize: 18, fontWeight: '900', color: '#14532D', flex: 1, marginRight: 10 },
    statusPill: { backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    statusText: { color: '#166534', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    amount: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 8 },
    meta: { fontSize: 12, color: '#64748B', marginBottom: 4 },
    evidenceBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 10, marginBottom: 10 },
    evidenceTitle: { fontSize: 12, color: '#374151', fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
    evidenceText: { fontSize: 14, color: '#111827', fontWeight: '800', marginBottom: 6 },
    receiptBox: { backgroundColor: '#ECFDF5', borderRadius: 8, padding: 10, marginBottom: 10 },
    receiptText: { color: '#166534', fontWeight: '900', fontSize: 13 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    actionButton: { flex: 1, backgroundColor: '#1E3A2F', minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    rejectButton: { backgroundColor: '#7F1D1D' },
    receiptButton: { backgroundColor: '#111827' },
    disabledButton: { backgroundColor: '#9CA3AF' },
    actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
    replayButton: { flex: 1, borderWidth: 1, borderColor: '#111827', minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    replayText: { color: '#111827', fontSize: 12, fontWeight: '900' },
    error: { color: '#B91C1C', fontWeight: '700', textAlign: 'center' },
    empty: { color: '#64748B', textAlign: 'center', marginTop: 30, fontWeight: '700' },
});

export default PaymentReviewScreen;
