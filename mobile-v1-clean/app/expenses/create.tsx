import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../src/context/AuthContext";
import { useSteward } from "../../src/context/StewardContext";
import { createExpense, getExpenseCategories } from "../../src/services/expenseApi";
import { PageHeader } from '../../src/components/PageHeader';

export default function CreateExpenseScreen() {
    const router = useRouter();
    const { session } = useAuth();
    const { profile } = useSteward();
    
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                // Fetch archetype specific categories
                const cats = await getExpenseCategories(profile?.business_category_key);
                setCategories(cats);
                if (cats.length > 0) {
                    setCategory(cats[0]);
                }
            } catch (error) {
                console.error("Failed to load categories:", error);
            } finally {
                setCategoriesLoading(false);
            }
        };
        loadCategories();
    }, [profile?.business_category_key]);

    const handleSave = async () => {
        if (!session?.user?.id) return;
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            Alert.alert("Invalid Input", "Please enter a valid positive amount.");
            return;
        }
        if (!category) {
            Alert.alert("Invalid Input", "Please select a category.");
            return;
        }
        if (!description) {
            Alert.alert("Invalid Input", "Please enter a description.");
            return;
        }

        setLoading(true);
        try {
            await createExpense({
                business_owner_id: session.user.id,
                amount: Number(amount),
                category,
                description,
                date
            });
            router.back();
        } catch (error) {
            Alert.alert("Error", "Failed to save expense.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: "Record Expense" }} />
            
            <View style={styles.formGroup}>
                <Text style={styles.label}>Amount (R)</Text>
                <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="e.g. 150.50"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                {categoriesLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                ) : (
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={category}
                            onValueChange={(itemValue) => setCategory(itemValue)}
                        >
                            {categories.map((cat) => (
                                <Picker.Item key={cat} label={cat} value={cat} />
                            ))}
                        </Picker>
                    </View>
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    placeholder="What was this expense for?"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                />
            </View>

            <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>Save Expense</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 16 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 16, fontWeight: "500", color: "#333", marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
    },
    textArea: { height: 80, textAlignVertical: "top" },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#f9f9f9",
    },
    saveButton: {
        backgroundColor: "#000",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        marginBottom: 40
    },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
