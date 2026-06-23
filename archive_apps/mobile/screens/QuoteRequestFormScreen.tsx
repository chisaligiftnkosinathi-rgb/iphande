import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { createQuoteRequest } from '../src/services/apiClient';
import type { QuoteRequestCreate } from '../src/types/api';

// Types for navigation params
// These should be passed from the post/content card
interface QuoteRequestFormParams {
    business_owner_id?: string;
    business_category_key?: string;
    business_line?: string;
    post_id?: string;
    business_name?: string;
    business_subtitle?: string;
}

type QuoteRequestFormRoute = RouteProp<Record<string, QuoteRequestFormParams>, string>;

const DEMO_BUSINESS = {
    business_owner_id: 'demo-owner-1',
    business_category_key: 'commission_based_sales',
    business_line: 'Funeral Cover Agent',
    post_id: 'demo-post-1',
    business_name: 'Funeral Cover Agent',
    business_subtitle: 'Helping families prepare with dignity.',
};

const QuoteRequestFormScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<QuoteRequestFormRoute>();

    // Get business context from route params or fallback to demo
    const {
        business_owner_id = DEMO_BUSINESS.business_owner_id,
        business_category_key = DEMO_BUSINESS.business_category_key,
        business_line = DEMO_BUSINESS.business_line,
        post_id = DEMO_BUSINESS.post_id,
        business_name = DEMO_BUSINESS.business_name,
        business_subtitle = DEMO_BUSINESS.business_subtitle,
    } = route.params || {};

    // Form state
    const [customer_name, setCustomerName] = useState('');
    const [customer_phone, setCustomerPhone] = useState('');
    const [customer_location, setCustomerLocation] = useState('');
    const [service_needed, setServiceNeeded] = useState('');
    const [preferred_date, setPreferredDate] = useState('');
    const [message, setMessage] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        const payload: QuoteRequestCreate = {
            business_owner_id,
            business_category_key,
            business_line,
            post_id,
            customer_name,
            customer_phone,
            customer_location: customer_location || undefined,
            service_needed: service_needed || undefined,
            preferred_date: preferred_date || undefined,
            message: message || undefined,
        };
        try {
            await createQuoteRequest(payload);
            setSuccess(true);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerLocation('');
            setServiceNeeded('');
            setPreferredDate('');
            setMessage('');
        } catch (err: any) {
            setError(err.message || 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <Text style={styles.header}>Request a Quote</Text>

                {/* Business Summary Card */}
                <View style={styles.businessCard}>
                    <Text style={styles.businessName}>{business_name}</Text>
                    <Text style={styles.businessSubtitle}>{business_subtitle}</Text>
                </View>

                {/* Form Fields */}
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                    style={styles.input}
                    value={customer_name}
                    onChangeText={setCustomerName}
                    placeholder="Your full name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                />

                <Text style={styles.label}>Phone / WhatsApp *</Text>
                <TextInput
                    style={styles.input}
                    value={customer_phone}
                    onChangeText={setCustomerPhone}
                    placeholder="e.g. 0712345678"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={customer_location}
                    onChangeText={setCustomerLocation}
                    placeholder="Your area or city (optional)"
                    placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>What do you need?</Text>
                <TextInput
                    style={[styles.input, { height: 60 }]}
                    value={service_needed}
                    onChangeText={setServiceNeeded}
                    placeholder="Describe your need (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                />

                <Text style={styles.label}>Preferred Contact Date</Text>
                <TextInput
                    style={styles.input}
                    value={preferred_date}
                    onChangeText={setPreferredDate}
                    placeholder="YYYY-MM-DD (optional)"
                    placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.label}>Additional Message</Text>
                <TextInput
                    style={[styles.input, { height: 60 }]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Anything else? (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                />

                {/* Submit Button */}
                <Pressable
                    style={[styles.button, loading && { opacity: 0.7 }]}
                    onPress={onSubmit}
                    disabled={loading || !customer_name || !customer_phone}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>Submit Request</Text>
                    )}
                </Pressable>

                {/* Success Message */}
                {success && (
                    <View style={styles.successBox}>
                        <Text style={styles.successText}>Your request was sent successfully! The business owner will contact you soon.</Text>
                    </View>
                )}

                {/* Error Message */}
                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Trust Footer */}
                <Text style={styles.trustFooter}>
                    Your information will only be shared with this business owner.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#F8FAF7',
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    header: {
        fontSize: 28,
        fontWeight: '900',
        color: '#102A20',
        marginBottom: 18,
        textAlign: 'center',
    },
    businessCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    businessName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#14532D',
        marginBottom: 4,
    },
    businessSubtitle: {
        fontSize: 14,
        color: '#3E6B57',
        textAlign: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#14532D',
        marginTop: 12,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#102A20',
        marginBottom: 4,
    },
    button: {
        backgroundColor: '#1E3A2F',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 22,
        marginBottom: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    trustFooter: {
        marginTop: 28,
        fontSize: 13,
        color: '#166534',
        textAlign: 'center',
        fontWeight: '700',
    },
    successBox: {
        backgroundColor: '#DCFCE7',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#22C55E',
    },
    successText: {
        color: '#15803D',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 15,
    },
    errorBox: {
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#B91C1C',
    },
    errorText: {
        color: '#B91C1C',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 15,
    },
});

export default QuoteRequestFormScreen;
