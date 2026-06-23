import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { useAuth } from '../src/auth/AuthContext';
import { buildApiUrl } from '../src/config/api';
import { addInventoryStock, consumeInventoryStock, listInventoryBalancesForBusiness } from '../src/services/apiClient';
import type { InventoryBalance } from '../src/types/api';

export const InventoryLedgerScreen = () => {
    const [balances, setBalances] = useState<InventoryBalance[]>([]);
    const [loading, setLoading] = useState(false);

    const [newItemName, setNewItemName] = useState('');
    const [newItemSku, setNewItemSku] = useState('');
    const [newItemUnit, setNewItemUnit] = useState('');

    const navigation = useNavigation<any>();
    const { stewardId } = useAuth() as any;

    const loadBalances = useCallback(async () => {
        if (!stewardId) return;
        setLoading(true);
        try {
            const data = await listInventoryBalancesForBusiness(stewardId);
            setBalances(data);
        } catch (error) {
            console.error(error);
            Alert.alert('API Unavailable', 'Failed to load inventory balances.');
        } finally {
            setLoading(false);
        }
    }, [stewardId]);

    useEffect(() => {
        loadBalances();
    }, [loadBalances]);

    const handleAddItem = async () => {
        if (!stewardId) return Alert.alert('Error', 'Steward identity missing.');
        if (!newItemName || !newItemSku) return Alert.alert('Validation', 'Name and SKU are required.');
        try {
            setLoading(true);
            const response = await fetch(buildApiUrl('/inventory/items'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_owner_id: stewardId,
                    sku: newItemSku,
                    name: newItemName,
                    unit: newItemUnit || 'unit',
                    active: true
                })
            });
            if (!response.ok) throw new Error('API unavailable');
            setNewItemName('');
            setNewItemSku('');
            setNewItemUnit('');
            await loadBalances();
        } catch (error) {
            Alert.alert('API Unavailable', 'Could not create inventory item.');
        }
    };

    const handleAddStock = async (itemId: string) => {
        try {
            await addInventoryStock(itemId, 1, 'Manual Add');
            loadBalances();
        } catch (error) {
            Alert.alert('API Unavailable', 'Failed to add stock');
        }
    };

    const handleConsumeStock = async (itemId: string) => {
        try {
            await consumeInventoryStock(itemId, 1, 'Manual Consume');
            loadBalances();
        } catch (error) {
            Alert.alert('API Unavailable', 'Failed to consume stock');
        }
    };

    const openReplay = (itemId: string) => {
        navigation.navigate('InventoryReplay', { itemId });
    };

    const renderItem = ({ item }: { item: any }) => {
        // Adapt to both potential API response shapes (item_id vs inventory_item_id)
        const id = item.item_id || item.inventory_item_id;
        const name = item.item_name || item.name;
        const currentBalance = item.current_balance ?? item.balance ?? 0;

        return (
            <View style={styles.card}>
                <Text style={styles.title}>{name}</Text>
                <Text style={styles.subtitle}>SKU: {item.sku} | Unit: {item.unit}</Text>
                <Text style={styles.balance}>Current Balance: {currentBalance}</Text>
                {item.latest_movement_date && (
                    <Text style={styles.movement}>
                        Latest Movement: {item.latest_movement_reason} on {item.latest_movement_date}
                    </Text>
                )}
                {item.continuity_event_id && (
                    <Text style={styles.movement}>Continuity Event: {item.continuity_event_id}</Text>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.button} onPress={() => handleAddStock(id)}>
                        <Text style={styles.buttonText}>Add Stock (+1)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => handleConsumeStock(id)}>
                        <Text style={styles.buttonText}>Consume (-1)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, { backgroundColor: '#111827' }]} onPress={() => openReplay(id)}>
                        <Text style={styles.buttonText}>Replay</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Inventory Ledger" />
            <View style={styles.container}>

                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Add Inventory Item</Text>
                    <TextInput style={styles.input} placeholder="Item Name" value={newItemName} onChangeText={setNewItemName} />
                    <View style={styles.row}>
                        <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="SKU" value={newItemSku} onChangeText={setNewItemSku} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Unit (e.g. kg, pcs)" value={newItemUnit} onChangeText={setNewItemUnit} />
                    </View>
                    <TouchableOpacity style={styles.submitButton} onPress={handleAddItem} disabled={loading}>
                        <Text style={styles.submitButtonText}>Create Item</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.doctrine}>Balance reconstructed from inventory movements.</Text>

                {loading && balances.length === 0 ? (
                    <ActivityIndicator size="large" color="#111827" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={balances}
                        keyExtractor={(item, index) => {
                            const id = item.item_id || (item as any).inventory_item_id;
                            return id ? String(id) : `balance-${index}`;
                        }}
                        renderItem={renderItem}
                        refreshing={loading}
                        onRefresh={loadBalances}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#F8FAF7' },
    formCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
    formTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
    row: { flexDirection: 'row' },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 10, marginBottom: 10, fontSize: 14, color: '#111827' },
    submitButton: { backgroundColor: '#1E3A2F', padding: 12, borderRadius: 6, alignItems: 'center' },
    submitButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    doctrine: { fontSize: 12, fontStyle: 'italic', color: '#666', marginBottom: 16, textAlign: 'center' },
    card: { padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#FFFFFF' },
    title: { fontSize: 18, fontWeight: '900', color: '#111827' },
    subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
    balance: { fontSize: 16, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
    movement: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
    actions: { flexDirection: 'row', justifyContent: 'space-between' },
    button: { backgroundColor: '#1E3A2F', padding: 10, borderRadius: 6, flex: 1, marginHorizontal: 4, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
