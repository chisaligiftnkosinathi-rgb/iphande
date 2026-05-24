import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const LocationScreen: React.FC = () => {
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
                <Text style={styles.eyebrow}>Geographic Context</Text>

                <Text style={styles.title}>Location</Text>

                <Text style={styles.description}>
                    Manage business location visibility, regional activity context, and community reach information.
                </Text>
            </View>

            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Location Details</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>

                    <TextInput
                        placeholder="Enter city"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Province / State</Text>

                    <TextInput
                        placeholder="Enter province"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Country</Text>

                    <TextInput
                        placeholder="Enter country"
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                    />
                </View>

                <View style={styles.buttonRow}>
                    <Pressable style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>Save Location</Text>
                    </Pressable>

                    <Pressable style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>Use Current</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.mapPlaceholder}>
                <Text style={styles.mapTitle}>Map & regional activity</Text>

                <Text style={styles.mapText}>
                    Geographic visualizations and nearby opportunity insights will appear here once APIs are connected.
                </Text>
            </View>

            <View style={styles.boundaryCard}>
                <Text style={styles.boundaryTitle}>Visibility boundary</Text>

                <Text style={styles.boundaryText}>
                    Location visibility should remain user-controlled and privacy-aware while still supporting truthful opportunity discovery.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8FAF7',
    },
    content: {
        padding: 20,
        gap: 16,
    },
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2F6B4F',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#102A20',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4B5563',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#111827',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#1E3A2F',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    secondaryButtonText: {
        color: '#1E3A2F',
        fontWeight: '700',
        fontSize: 14,
    },
    mapPlaceholder: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    mapTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 10,
    },
    mapText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
    },
    boundaryCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    boundaryTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#92400E',
        marginBottom: 8,
    },
    boundaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#78350F',
    },
});

export default LocationScreen;
