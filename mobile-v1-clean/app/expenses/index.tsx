import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../src/state/AuthContext";
import { getExpenses, getExpenseSummary } from "../../src/api/expenseApi";
import { ExpenseOut, ExpenseSummaryOut } from "../../src/types";
import { PageHeader } from '../components/PageHeader';

export default function ExpensesScreen() {
    const router = useRouter();
    const { session } = useAuth();
    
    const [expenses, setExpenses] = useState<ExpenseOut[]>([]);
    const [summary, setSummary] = useState<ExpenseSummaryOut | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    const loadData = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const [exps, summ] = await Promise.all([
                getExpenses(session.user.id),
                getExpenseSummary(session.user.id)
            ]);
            setExpenses(exps);
            setSummary(summ);
            setFetchError(false);
        } catch (error) {
            console.error(error);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [session?.user?.id]);

    const renderItem = ({ item }: { item: ExpenseOut }) => (
        <View style={styles.expenseItem}>
            <View style={styles.expenseRow}>
                <Text style={styles.expenseCategory}>{item.category}</Text>
                <Text style={styles.expenseAmount}>- R{item.amount}</Text>
            </View>
            <Text style={styles.expenseDesc}>{item.description}</Text>
            <Text style={styles.expenseDate}>{item.date}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "Expense Tracker" }} />
            
            {loading ? (
                <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
            ) : fetchError ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Unable to load expenses.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {summary && (
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Monthly Summary</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Income:</Text>
                                <Text style={styles.incomeAmount}>R{summary.income}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Expenses:</Text>
                                <Text style={styles.expenseAmountRed}>R{summary.expenses}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Net Position:</Text>
                                <Text style={parseFloat(summary.net_position) >= 0 ? styles.incomeAmount : styles.expenseAmountRed}>
                                    R{summary.net_position}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.headerRow}>
                        <Text style={styles.sectionTitle}>Recent Expenses</Text>
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={() => router.push("/expenses/create")}
                        >
                            <Text style={styles.addButtonText}>+ Add</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={expenses}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={<Text style={styles.emptyText}>No expenses recorded yet.</Text>}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
    summaryCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    summaryTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    summaryLabel: { fontSize: 16, color: "#555" },
    incomeAmount: { fontSize: 16, fontWeight: "bold", color: "#2E7D32" },
    expenseAmountRed: { fontSize: 16, fontWeight: "bold", color: "#D32F2F" },
    summaryDivider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
    addButton: { backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    addButtonText: { color: "#fff", fontWeight: "bold" },
    expenseItem: { backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12 },
    expenseRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    expenseCategory: { fontSize: 16, fontWeight: "600", color: "#333" },
    expenseAmount: { fontSize: 16, fontWeight: "bold", color: "#D32F2F" },
    expenseDesc: { fontSize: 14, color: "#666", marginBottom: 8 },
    expenseDate: { fontSize: 12, color: "#999" },
    emptyText: { textAlign: "center", color: "#666", marginTop: 20 },
    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
    retryButton: { backgroundColor: "#000", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    retryButtonText: { color: "#fff", fontWeight: "bold" },
});
