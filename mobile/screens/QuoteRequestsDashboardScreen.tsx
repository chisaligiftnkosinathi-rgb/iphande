import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { listQuoteRequests } from '../src/services/apiClient';
import type { QuoteRequest } from '../src/types/api';

const QuoteRequestsDashboardScreen: React.FC = () => {
    const [requests, setRequests] = useState<QuoteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listQuoteRequests();
            setRequests(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load quote requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const renderItem = ({ item }: { item: QuoteRequest }) => (
        <View style={styles.card}>
            <Text style={styles.title}>{item.customer_name} ({item.customer_phone})</Text>
            <Text style={styles.subtitle}>{item.service_needed || 'No service specified'}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            <Text style={styles.meta}>Requested: {new Date(item.created_at).toLocaleString()}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Quote Requests Dashboard</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#1E3A2F" style={{ marginTop: 40 }} />
            ) : error ? (
                <Text style={styles.error}>{error}</Text>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<Text style={styles.empty}>No quote requests found.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF7', padding: 20 },
    header: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 18, textAlign: 'center' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#102A20',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    title: { fontSize: 17, fontWeight: '700', color: '#14532D' },
    subtitle: { fontSize: 14, color: '#3E6B57', marginBottom: 6 },
    status: { fontSize: 13, color: '#166534', fontWeight: '700', marginBottom: 2 },
    meta: { fontSize: 12, color: '#64748B' },
    error: { color: '#B91C1C', fontWeight: '700', textAlign: 'center', marginTop: 30 },
    empty: { color: '#64748B', textAlign: 'center', marginTop: 30 },
});

export default QuoteRequestsDashboardScreen;
