import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSteward } from '../../src/context/StewardContext';
import { updateMe } from '../../src/services/stewardApi';
import { useAuth } from '../../src/context/AuthContext';
import { Link } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../../src/components/PageHeader';

export default function AccountSettingsScreen() {
    const { profile, refreshProfile } = useSteward();
    const { signOut } = useAuth();
    const router = useRouter();
    const [name, setName] = useState(profile?.name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [whatsapp, setWhatsapp] = useState(profile?.whatsapp_number || profile?.whatsapp || '');
    const [location, setLocation] = useState(profile?.operating_area || profile?.location || '');
    const [latitude, setLatitude] = useState<number | null>(profile?.latitude || null);
    const [longitude, setLongitude] = useState<number | null>(profile?.longitude || null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [companyLogoUrl, setCompanyLogoUrl] = useState(profile?.company_logo_url || profile?.logo_url || '');
    const [saving, setSaving] = useState(false);

    const dropPin = async () => {
        setLocationLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied.');
                setLocationLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLatitude(loc.coords.latitude);
            setLongitude(loc.coords.longitude);
            Alert.alert('Success', 'Business location pin set successfully! Remember to save changes.');
        } catch (err) {
            Alert.alert('Error', 'Could not fetch location. Please try again.');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty.");
            return;
        }
        setSaving(true);
        try {
            await updateMe({ 
                name: name.trim(), 
                phone: phone.trim(),
                whatsapp_number: whatsapp.trim(),
                operating_area: location.trim(),
                company_logo_url: companyLogoUrl.trim(),
                latitude,
                longitude
            });
            await refreshProfile();
            Alert.alert("Success", "Profile updated successfully.", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error("Failed to update profile:", error);
            Alert.alert("Error", "Failed to update profile details. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/auth/login');
        } catch (error) {
            console.error("Failed to sign out:", error);
        }
    };

    const isComplete = profile?.onboardingComplete || profile?.onboarding_completed;

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <PageHeader 
                eyebrow="Account" 
                title="Settings" 
                subtitle="Manage your steward profile settings." 
            />

            <View style={styles.subsection}>
                {/* Identity */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Identity</Text>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Mandla Zulu"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="e.g. 082 123 4567"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Contact */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Contact</Text>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>WhatsApp Number</Text>
                        <TextInput
                            style={styles.input}
                            value={whatsapp}
                            onChangeText={setWhatsapp}
                            placeholder="e.g. +27821234567"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Company Logo URL (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={companyLogoUrl}
                            onChangeText={setCompanyLogoUrl}
                            placeholder="https://example.com/logo.png"
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Location / Operating Area</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="e.g. Soweto, Gauteng"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Business Location Pin (Optional)</Text>
                        {latitude && longitude ? (
                            <View style={styles.pinSuccess}>
                                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                                <Text style={styles.pinSuccessText}>Pin Set ({latitude.toFixed(2)}, {longitude.toFixed(2)})</Text>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.pinButton} onPress={dropPin} disabled={locationLoading}>
                                {locationLoading ? (
                                    <ActivityIndicator color="#111827" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="location-outline" size={20} color="#111827" />
                                        <Text style={styles.pinButtonText}>Set GPS Pin for customers</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                            Helps customers see how far away your business is.
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.primaryButton, saving && styles.buttonDisabled]} 
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Visibility Health */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Visibility Health</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Profile Completeness</Text>
                        <Text style={styles.value}>{isComplete ? 'Complete' : 'Incomplete'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Public Slug</Text>
                        <Text style={styles.value}>{profile?.slug || 'Not set'}</Text>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.card}>
                    <Text style={styles.sectionHeading}>Danger Zone</Text>
                    <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
                        <Text style={styles.dangerButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Legal */}
                <Link href="/legal" asChild>
                    <TouchableOpacity style={{ padding: 16, alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '600' }}>Legal & Privacy</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    subsection: { padding: 24 },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: '#111827' },
    primaryButton: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.6 },
    sectionHeading: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    value: { fontSize: 14, color: '#111827', fontWeight: '500' },
    dangerButton: { backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
    dangerButtonText: { color: '#DC2626', fontWeight: '800', fontSize: 15 },
    pinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, gap: 8 },
    pinButtonText: { color: '#111827', fontSize: 15, fontWeight: '600' },
    pinSuccess: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', padding: 14, borderRadius: 12, gap: 8 },
    pinSuccessText: { color: '#065F46', fontSize: 15, fontWeight: '600' }
});
