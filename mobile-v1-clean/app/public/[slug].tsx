import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL } from '../../src/config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Clamp usable width for wide web views
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH, 600);
const GALLERY_PAD = 24; // horizontal padding inside section
const GALLERY_GAP = 8;  // gap between images

interface BusinessProfile {
    slug: string;
    name: string;
    category: string | null;
    steward_story: string;
    provider_type: string | null;
    location_string: string;
    whatsapp_number: string | null;
    cover_photo_url: string | null;
    logo_url: string | null;
    supporting_images: string[];
    services: string[];
}

// ─── Parsers ────────────────────────────────────────────────────────────────

const parseSupportingImages = (value: unknown): string[] => {
    if (Array.isArray(value)) return (value as string[]).filter(Boolean);

    if (typeof value !== 'string' || !value.trim()) return [];

    // Strip outer quotes: handles '""' case from DB
    const stripped = value.trim().replace(/^"+|"+$/g, '').trim();
    if (!stripped) return [];

    // Try JSON parse first
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return (parsed as string[]).filter(Boolean);
        if (typeof parsed === 'string') return parsed ? [parsed] : [];
    } catch { /* not valid JSON — fall through to CSV */ }

    return stripped
        .split(',')
        .map((s) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
};


const parseServices = (value: unknown): string[] => {
    if (!value || value === 'None' || value === 'null') return [];
    if (Array.isArray(value)) return (value as string[]).filter(Boolean);
    if (typeof value === 'string') {
        return value.split(',').map((s) => s.trim()).filter((s) => s && s !== 'None');
    }
    return [];
};


// ─── Proof of Work Gallery ───────────────────────────────────────────────────

function ProofOfWorkGallery({ images }: { images: string[] }) {
    const capped = images.slice(0, 5);
    const count = capped.length;
    const innerWidth = CONTENT_WIDTH - GALLERY_PAD * 2;
    const halfWidth = (innerWidth - GALLERY_GAP) / 2;

    const imgStyle = (w: number, h: number) => ({
        width: w,
        height: h,
        borderRadius: 12,
        backgroundColor: '#E8DFD0' as const,
    });

    return (
        <View style={styles.powSection}>
            <Text style={styles.powTitle}>Proof of Work</Text>
            <Text style={styles.powSubtitle}>Evidence of completed work, service quality, and trust.</Text>

            {count === 0 && (
                <View style={styles.powEmpty}>
                    <Text style={styles.powEmptyIcon}>📷</Text>
                    <Text style={styles.powEmptyText}>No proof images uploaded yet.</Text>
                    <Text style={styles.powEmptyHint}>The steward will add completed work photos here.</Text>
                </View>
            )}

            {count === 1 && (
                <Image
                    source={{ uri: capped[0] }}
                    style={[imgStyle(innerWidth, 220), { resizeMode: 'cover' }]}
                />
            )}

            {count === 2 && (
                <View style={styles.rowWrap}>
                    {capped.map((uri, i) => (
                        <Image
                            key={`pow-${i}`}
                            source={{ uri }}
                            style={[imgStyle(halfWidth, 180), { resizeMode: 'cover' }, i > 0 && { marginLeft: GALLERY_GAP }]}
                        />
                    ))}
                </View>
            )}

            {count === 3 && (
                <>
                    <Image
                        source={{ uri: capped[0] }}
                        style={[imgStyle(innerWidth, 200), { resizeMode: 'cover' }, { marginBottom: GALLERY_GAP }]}
                    />
                    <View style={styles.rowWrap}>
                        {capped.slice(1).map((uri, i) => (
                            <Image
                                key={`pow-${i + 1}`}
                                source={{ uri }}
                                style={[imgStyle(halfWidth, 150), { resizeMode: 'cover' }, i > 0 && { marginLeft: GALLERY_GAP }]}
                            />
                        ))}
                    </View>
                </>
            )}

            {count === 4 && (
                <>
                    <View style={[styles.rowWrap, { marginBottom: GALLERY_GAP }]}>
                        {capped.slice(0, 2).map((uri, i) => (
                            <Image
                                key={`pow-${i}`}
                                source={{ uri }}
                                style={[imgStyle(halfWidth, 160), { resizeMode: 'cover' }, i > 0 && { marginLeft: GALLERY_GAP }]}
                            />
                        ))}
                    </View>
                    <View style={styles.rowWrap}>
                        {capped.slice(2).map((uri, i) => (
                            <Image
                                key={`pow-${i + 2}`}
                                source={{ uri }}
                                style={[imgStyle(halfWidth, 160), { resizeMode: 'cover' }, i > 0 && { marginLeft: GALLERY_GAP }]}
                            />
                        ))}
                    </View>
                </>
            )}

            {count === 5 && (
                <>
                    <Image
                        source={{ uri: capped[0] }}
                        style={[imgStyle(innerWidth, 200), { resizeMode: 'cover' }, { marginBottom: GALLERY_GAP }]}
                    />
                    <View style={[styles.rowWrap, { marginBottom: GALLERY_GAP }]}>
                        {capped.slice(1, 3).map((uri, i) => (
                            <Image
                                key={`pow-${i + 1}`}
                                source={{ uri }}
                                style={[imgStyle(halfWidth, 140), { resizeMode: 'cover' }, i > 0 && { marginLeft: GALLERY_GAP }]}
                            />
                        ))}
                    </View>
                    <View style={styles.rowWrap}>
                        {capped.slice(3).map((uri, i) => (
                            <Image
                                key={`pow-${i + 3}`}
                                source={{ uri }}
                                style={[imgStyle(halfWidth, 140), { resizeMode: 'cover' }, i > 0 && { marginLeft: GALLERY_GAP }]}
                            />
                        ))}
                    </View>
                </>
            )}
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function BusinessProfileScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isRequesting, setIsRequesting] = useState(false);
    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadService, setLeadService] = useState('');
    const [leadMessage, setLeadMessage] = useState('');
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            setError('Profile slug not provided.');
            return;
        }

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/public/${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    // Sanitize fields that may arrive as the literal string "None" from the backend
                    const clean = (v: unknown): string | null => {
                        if (!v || String(v).trim() === '' || String(v).trim().toLowerCase() === 'none') return null;
                        return String(v);
                    };
                    setProfile({
                        slug: data.slug,
                        name: data.name,
                        category: clean(data.business_category_key),
                        provider_type: clean(data.provider_type),
                        steward_story: clean(data.short_bio) ?? clean(data.steward_story) ?? 'No story provided yet.',
                        location_string: clean(data.location) ?? clean(data.operating_area) ?? 'Location not specified',
                        whatsapp_number: clean(data.whatsapp_number) ?? clean(data.phone),
                        cover_photo_url: clean(data.cover_photo_url),
                        logo_url: clean(data.logo_url),
                        supporting_images: parseSupportingImages(data.supporting_image_urls),
                        services: parseServices(data.services),
                    });

                } else {
                    const errText = await response.text();
                    throw new Error(`Error ${response.status}: ${errText}`);
                }
            } catch (fetchError: unknown) {
                const msg = fetchError instanceof Error ? fetchError.message : 'An error occurred.';
                setError(msg);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [slug]);

    const handleWhatsApp = () => {
        if (!profile?.whatsapp_number) return;
        const message = encodeURIComponent(`Hi ${profile.name}, I found your profile on iPhande and would like to request a service.`);
        let cleanPhone = profile.whatsapp_number.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '27' + cleanPhone.substring(1);
        }
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
    };

    const submitLead = async () => {
        if (!leadName.trim() || !leadPhone.trim()) {
            setSubmitError('Name and Phone are required.');
            return;
        }
        setSubmitStatus('submitting');
        setSubmitError('');
        try {
            const response = await fetch(`${API_BASE_URL}/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile_slug: slug,
                    name: leadName.trim(),
                    phone: leadPhone.trim(),
                    service_needed: leadService.trim() || undefined,
                    message: leadMessage.trim() || undefined,
                    source: 'public_profile',
                }),
            });
            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(errBody || 'Failed to submit request.');
            }
            setSubmitStatus('success');
        } catch (err: unknown) {
            setSubmitStatus('error');
            setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5D7A5A" />
                <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
        );
    }

    // ── Error / Not Found ────────────────────────────────────────────────────
    if (error || !profile) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>🔍</Text>
                <Text style={styles.errorTitle}>Profile not found</Text>
                <Text style={styles.errorText}>{error || 'This steward profile does not exist.'}</Text>
            </View>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

            {/* 1. HERO IMAGE */}
            <View style={styles.heroContainer}>
                {profile.cover_photo_url ? (
                    <Image source={{ uri: profile.cover_photo_url }} style={styles.heroImage} />
                ) : (
                    <View style={[styles.heroImage, styles.heroPlaceholder]}>
                        <Text style={styles.heroPlaceholderText}>iPhande</Text>
                    </View>
                )}
            </View>

            {/* 2. IDENTITY */}
            <View style={styles.identityCenter}>
                <View style={styles.avatarRing}>
                    {profile.logo_url ? (
                        <Image source={{ uri: profile.logo_url }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.logoTextFallback}>
                            {profile.name?.substring(0, 2).toUpperCase() ?? 'ST'}
                        </Text>
                    )}
                </View>
                <Text style={styles.businessName}>{profile.name}</Text>
                {profile.provider_type ? (
                    <Text style={styles.providerType}>{profile.provider_type}</Text>
                ) : null}
                {profile.category ? (
                    <Text style={styles.businessCategory}>
                        {profile.category.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                ) : null}
                <Text style={styles.locationText}>📍 {profile.location_string}</Text>
            </View>

            {/* 3. CTA BUTTONS */}
            <View style={styles.ctaRow}>
                {profile.whatsapp_number ? (
                    <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp} accessibilityLabel="Contact via WhatsApp">
                        <Text style={styles.whatsappButtonText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                    style={[styles.requestButton, !profile.whatsapp_number && styles.requestButtonFull]}
                    onPress={() => setIsRequesting(!isRequesting)}
                    accessibilityLabel="Request a service"
                >
                    <Text style={styles.requestButtonText}>📝 Request Service</Text>
                </TouchableOpacity>
            </View>

            {/* 4. REQUEST FORM */}
            {isRequesting && (
                <View style={styles.formContainer}>
                    {submitStatus === 'success' ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successIcon}>✅</Text>
                            <Text style={styles.successTitle}>Request Sent!</Text>
                            <Text style={styles.successText}>
                                {profile.name} will contact you soon. Keep an eye on your phone.
                            </Text>
                            <TouchableOpacity style={styles.closeFormButton} onPress={() => setIsRequesting(false)}>
                                <Text style={styles.closeFormButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.formTitle}>Request a Service</Text>

                            <Text style={styles.label}>Your Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={leadName}
                                onChangeText={setLeadName}
                                placeholder="Jane Doe"
                                placeholderTextColor="#9EAD9B"
                                autoCapitalize="words"
                            />

                            <Text style={styles.label}>Your Phone *</Text>
                            <TextInput
                                style={styles.input}
                                value={leadPhone}
                                onChangeText={setLeadPhone}
                                placeholder="082 123 4567"
                                placeholderTextColor="#9EAD9B"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Service Needed</Text>
                            <TextInput
                                style={styles.input}
                                value={leadService}
                                onChangeText={setLeadService}
                                placeholder="e.g. Plumbing repair"
                                placeholderTextColor="#9EAD9B"
                            />

                            <Text style={styles.label}>Message</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={leadMessage}
                                onChangeText={setLeadMessage}
                                placeholder="Any details that will help the steward understand your needs…"
                                placeholderTextColor="#9EAD9B"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            {submitStatus === 'error' && (
                                <Text style={styles.errorTextSmall}>{submitError}</Text>
                            )}

                            <TouchableOpacity
                                style={[styles.submitButton, submitStatus === 'submitting' && styles.submitButtonDisabled]}
                                onPress={submitLead}
                                disabled={submitStatus === 'submitting'}
                                accessibilityLabel="Submit service request"
                            >
                                <Text style={styles.submitButtonText}>
                                    {submitStatus === 'submitting' ? 'Sending…' : 'Send Request'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            {/* 5. THE STORY */}
            <View style={styles.storyOrbit}>
                <Text style={styles.sectionLabel}>The Story</Text>
                <Text style={styles.storyText}>"{profile.steward_story}"</Text>
            </View>

            {/* 6. SERVICES */}
            {profile.services.length > 0 && (
                <View style={styles.servicesContainer}>
                    <Text style={styles.sectionLabel}>Services</Text>
                    <View style={styles.serviceGrid}>
                        {profile.services.map((service, idx) => (
                            <View key={idx} style={styles.servicePill}>
                                <Text style={styles.servicePillText}>✓ {service}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* 7. PROOF OF WORK */}
            <ProofOfWorkGallery images={profile.supporting_images} />

        </ScrollView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F3EA' },
    contentContainer: { paddingBottom: 80, maxWidth: 600, alignSelf: 'center', width: '100%' },

    // Loading
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F3EA' },
    loadingText: { marginTop: 12, fontSize: 15, color: '#6F7D75' },

    // Error
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F7F3EA' },
    errorIcon: { fontSize: 40, marginBottom: 16 },
    errorTitle: { fontSize: 20, fontWeight: '800', color: '#24352F', marginBottom: 8 },
    errorText: { textAlign: 'center', fontSize: 15, color: '#6F7D75', lineHeight: 22 },

    // Hero
    heroContainer: { width: '100%', height: 210, backgroundColor: '#E8DFD0', overflow: 'hidden' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    heroPlaceholderText: { fontSize: 28, fontWeight: '800', color: '#9EAD9B', letterSpacing: 4 },

    // Identity
    identityCenter: { alignItems: 'center', marginTop: -60, paddingHorizontal: 20, zIndex: 10 },
    avatarRing: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#FFFDF8',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
        borderWidth: 3, borderColor: '#F7F3EA',
    },
    avatar: { width: 112, height: 112, borderRadius: 56 },
    logoTextFallback: { fontSize: 38, fontWeight: '800', color: '#5D7A5A' },
    businessName: { fontSize: 26, fontWeight: '800', color: '#24352F', marginTop: 14, textAlign: 'center', letterSpacing: 0.3 },
    providerType: { fontSize: 15, color: '#24352F', fontWeight: '600', marginTop: 4, textAlign: 'center' },
    businessCategory: { fontSize: 12, color: '#5D7A5A', fontWeight: '700', marginTop: 4, textAlign: 'center', letterSpacing: 1.2 },
    locationText: { fontSize: 14, color: '#6F7D75', marginTop: 6, fontWeight: '500' },

    // CTA Row
    ctaRow: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 28, gap: 12 },
    whatsappButton: {
        flex: 1, backgroundColor: '#25D366', paddingVertical: 15, borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    whatsappButtonText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
    requestButton: {
        flex: 1, backgroundColor: '#24352F', paddingVertical: 15, borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    requestButtonFull: { flex: 1 },
    requestButtonText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },

    // Form
    formContainer: {
        marginHorizontal: 24, marginTop: 24, backgroundColor: '#FFFDF8',
        padding: 22, borderRadius: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    formTitle: { fontSize: 19, fontWeight: '800', color: '#24352F', marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '700', color: '#6F7D75', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8DFD0',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#24352F', marginBottom: 14,
    },
    textArea: { height: 90, paddingTop: 12 },
    submitButton: { backgroundColor: '#5D7A5A', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 6 },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    errorTextSmall: { color: '#C0392B', fontSize: 13, marginBottom: 12, fontWeight: '600' },
    successBox: { alignItems: 'center', paddingVertical: 24 },
    successIcon: { fontSize: 36, marginBottom: 12 },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#5D7A5A', marginBottom: 8 },
    successText: { fontSize: 15, color: '#6F7D75', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    closeFormButton: { backgroundColor: '#E8DFD0', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
    closeFormButtonText: { color: '#24352F', fontWeight: '700', fontSize: 14 },

    // Shared section label
    sectionLabel: {
        fontSize: 11, fontWeight: '800', color: '#9EAD9B',
        textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14, textAlign: 'center',
    },

    // Story
    storyOrbit: { marginTop: 36, paddingHorizontal: 28, alignItems: 'center' },
    storyText: { fontSize: 16, fontStyle: 'italic', color: '#24352F', textAlign: 'center', lineHeight: 26 },

    // Services
    servicesContainer: { paddingHorizontal: 24, marginTop: 36, alignItems: 'center' },
    serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    servicePill: {
        backgroundColor: '#EDF3EC', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
        borderWidth: 1, borderColor: '#C5D9C2',
    },
    servicePillText: { fontSize: 14, color: '#3D5E3A', fontWeight: '600' },

    // Proof of Work
    powSection: { marginTop: 40, paddingHorizontal: GALLERY_PAD, paddingBottom: 20 },
    powTitle: {
        fontSize: 11, fontWeight: '800', color: '#9EAD9B',
        textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 6,
    },
    powSubtitle: { fontSize: 13, color: '#6F7D75', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
    rowWrap: { flexDirection: 'row', alignItems: 'flex-start' },
    powEmpty: {
        backgroundColor: '#FFFDF8', borderRadius: 16, padding: 32,
        alignItems: 'center', borderWidth: 1.5, borderColor: '#E8DFD0', borderStyle: 'dashed',
    },
    powEmptyIcon: { fontSize: 32, marginBottom: 12 },
    powEmptyText: { fontSize: 15, fontWeight: '700', color: '#6F7D75', marginBottom: 6 },
    powEmptyHint: { fontSize: 13, color: '#9EAD9B', textAlign: 'center' },
});
