import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSteward } from '../src/context/StewardContext';

export default function UpgradeScreen() {
    const router = useRouter();
    const { feature, pack } = useLocalSearchParams();
    const { profile } = useSteward();

    const requestUpgrade = async (plan: string) => {
        // In V1, we just alert or route to manual admin instruction.
        alert(`Upgrade to ${plan} requested. For this simulation, an admin will activate it.`);
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {feature && (
                <View style={styles.contextBox}>
                    <Text style={styles.contextTitle}>You discovered {feature}!</Text>
                    <Text style={styles.contextText}>
                        {feature} is part of the {pack || 'premium'} pack. Upgrade to unlock this tool.
                    </Text>
                </View>
            )}

            <Text style={styles.mainTitle}>iPhande Plans</Text>
            <Text style={styles.subtitle}>Choose the right tools for your business</Text>

            {/* Verified Steward Plan */}
            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Verified Steward</Text>
                    <Text style={styles.planPrice}>R120 <Text style={styles.planPriceSub}>once-off</Text></Text>
                </View>
                <Text style={styles.planDesc}>Build trust and stand out in the community.</Text>
                <Text style={styles.featureItem}>✓ Verified Badge</Text>
                <Text style={styles.featureItem}>✓ Trust Status</Text>
                <Text style={styles.featureItem}>✓ Higher Ranking in Search</Text>
                <TouchableOpacity style={styles.button} onPress={() => requestUpgrade('verified_once_off')}>
                    <Text style={styles.buttonText}>Get Verified</Text>
                </TouchableOpacity>
            </View>

            {/* Documents Pack */}
            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Documents Pack</Text>
                    <Text style={styles.planPrice}>R49 <Text style={styles.planPriceSub}>/mo</Text></Text>
                </View>
                <Text style={styles.planDesc}>Send professional prices to customers.</Text>
                <Text style={styles.featureItem}>✓ Quotes</Text>
                <Text style={styles.featureItem}>✓ Invoices</Text>
                <Text style={styles.featureItem}>✓ Receipts</Text>
                <Text style={styles.featureItem}>✓ PDF Downloads with Logo</Text>
                <TouchableOpacity style={styles.button} onPress={() => requestUpgrade('documents')}>
                    <Text style={styles.buttonText}>Unlock Documents</Text>
                </TouchableOpacity>
            </View>

            {/* Continuity Pack */}
            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Continuity Pack</Text>
                    <Text style={styles.planPrice}>R99 <Text style={styles.planPriceSub}>/mo</Text></Text>
                </View>
                <Text style={styles.planDesc}>Prove your work history to anyone.</Text>
                <Text style={styles.featureItem}>✓ Proof of Work</Text>
                <Text style={styles.featureItem}>✓ Official Timeline Evidence</Text>
                <Text style={styles.featureItem}>✓ Replay History</Text>
                <TouchableOpacity style={styles.button} onPress={() => requestUpgrade('continuity')}>
                    <Text style={styles.buttonText}>Unlock Continuity</Text>
                </TouchableOpacity>
            </View>

            {/* Business Pack */}
            <View style={[styles.planCard, styles.businessCard]}>
                <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>Full Business</Text>
                    <Text style={styles.planPrice}>R199 <Text style={styles.planPriceSub}>/mo</Text></Text>
                </View>
                <Text style={styles.planDesc}>Everything you need to run your business.</Text>
                <Text style={styles.featureItem}>✓ All Documents</Text>
                <Text style={styles.featureItem}>✓ All Continuity Features</Text>
                <Text style={styles.featureItem}>✓ Expenses & Inventory</Text>
                <Text style={styles.featureItem}>✓ Business Reports & Export</Text>
                <TouchableOpacity style={[styles.button, styles.businessButton]} onPress={() => requestUpgrade('business')}>
                    <Text style={[styles.buttonText, { color: '#000' }]}>Get Business Pack</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 20,
        backgroundColor: '#111',
        flexGrow: 1,
    },
    contextBox: {
        backgroundColor: '#2563eb15',
        borderWidth: 1,
        borderColor: '#3b82f6',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    contextTitle: {
        color: '#60a5fa',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    contextText: {
        color: '#bfdbfe',
        fontSize: 14,
        lineHeight: 20,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 24,
        textAlign: 'center',
    },
    planCard: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    businessCard: {
        borderColor: '#ffb900',
        backgroundColor: '#261c00',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    planTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    planPrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    planPriceSub: {
        fontSize: 14,
        color: '#aaa',
        fontWeight: 'normal',
    },
    planDesc: {
        fontSize: 15,
        color: '#bbb',
        marginBottom: 16,
    },
    featureItem: {
        fontSize: 14,
        color: '#ddd',
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#333',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    businessButton: {
        backgroundColor: '#ffb900',
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backButton: {
        paddingVertical: 16,
        marginTop: 16,
        marginBottom: 32,
    },
    backButtonText: {
        color: '#aaa',
        textAlign: 'center',
        fontSize: 16,
    },
});
