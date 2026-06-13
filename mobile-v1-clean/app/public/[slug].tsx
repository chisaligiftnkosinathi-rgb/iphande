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
    View,
} from 'react-native';
import { API_BASE_URL } from '../../src/config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH, 600);
const PAD = 24;
const GAP = 8;
const INNER = CONTENT_WIDTH - PAD * 2;
const HALF = (INNER - GAP) / 2;

// ─── Data Interfaces ──────────────────────────────────────────────────────────

interface ProofOfWorkItem {
    url: string;
    title?: string;
    completed_date?: string;
    note?: string;
}

interface BusinessProfile {
    slug: string;
    name: string;
    category: string | null;
    provider_type: string | null;
    business_line: string | null;      // primary service
    short_bio: string | null;
    location_string: string | null;
    operating_area: string | null;
    address_label: string | null;
    province: string | null;
    city: string | null;
    suburb: string | null;
    service_radius_km: number | null;
    service_area_notes: string | null;
    whatsapp_number: string | null;
    availability: string | null;
    cover_photo_url: string | null;
    logo_url: string | null;
    proof_items: ProofOfWorkItem[];   // parsed from proof_of_work_items + supporting_image_urls
    services: string[];
    created_at: string | null;
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

const clean = (v: unknown): string | null => {
    if (!v) return null;
    const s = String(v).trim();
    if (s === '' || s.toLowerCase() === 'none' || s === 'null') return null;
    return s;
};

const parseServices = (value: unknown): string[] => {
    const s = clean(value);
    if (!s) return [];
    if (Array.isArray(value)) return (value as string[]).filter(Boolean);
    return s.split(',').map((x) => x.trim()).filter((x) => x && x !== 'None');
};

const parseSupportingImages = (value: unknown): string[] => {
    if (Array.isArray(value)) return (value as string[]).filter(Boolean);
    const s = clean(value);
    if (!s) return [];
    // strip outer quotes like '""'
    const stripped = s.replace(/^"+|"+$/g, '').trim();
    if (!stripped) return [];
    try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return (parsed as string[]).filter(Boolean);
        if (typeof parsed === 'string') return parsed ? [parsed] : [];
    } catch { /* fall through */ }
    return stripped.split(',').map((x) => x.trim()).filter(Boolean);
};

const parseProofOfWorkItems = (
    powItemsJson: unknown,
    imageUrls: unknown
): ProofOfWorkItem[] => {
    // Try structured proof_of_work_items first
    const s = clean(powItemsJson);
    if (s) {
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return (parsed as ProofOfWorkItem[]).filter((x) => x?.url).slice(0, 5);
            }
        } catch { /* fall through */ }
    }
    // Fall back to plain image URLs
    return parseSupportingImages(imageUrls).slice(0, 5).map((url) => ({ url }));
};

const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
};

const formatJoinDate = (isoStr: string | null): string => {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        return d.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
    } catch { return ''; }
};

const getAvailabilityDisplay = (
    val: string | null
): { label: string; color: string; icon: string } => {
    if (!val) return { label: 'Status not set', color: '#9EAD9B', icon: '○' };
    const v = val.toLowerCase();
    if (v.includes('accept') || v.includes('available') || v.includes('open'))
        return { label: val, color: '#2E7D32', icon: '✓' };
    if (v.includes('busy') || v.includes('full') || v.includes('unavailable'))
        return { label: val, color: '#C62828', icon: '✗' };
    return { label: val, color: '#E65100', icon: '◷' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <View style={sc.sectionHeader}>
            <Text style={sc.sectionTitle}>{title}</Text>
            {subtitle ? <Text style={sc.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
    );
}

function ProofGallery({ items }: { items: ProofOfWorkItem[] }) {
    const paddedItems = [...items];
    while (paddedItems.length < 5) {
        paddedItems.push({ url: '' }); // empty placeholder
    }

    const imgStyle = (w: number, h: number) => ({
        width: w, height: h, borderRadius: 12,
        backgroundColor: '#F9FAFB' as const,
        resizeMode: 'cover' as const,
    });

    const emptyStyle = (w: number, h: number) => ({
        width: w, height: h, borderRadius: 12,
        backgroundColor: '#F9FAFB' as const,
        borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' as const,
        justifyContent: 'center' as const, alignItems: 'center' as const,
    });

    const ItemCard = ({ item, w, h }: { item: ProofOfWorkItem; w: number; h: number }) => {
        if (!item.url) {
            return (
                <View style={emptyStyle(w, h)}>
                    <Text style={{ fontSize: 24, color: '#D1D5DB' }}>+</Text>
                </View>
            );
        }
        return (
            <View style={{ width: w, marginBottom: item.title || item.note ? 0 : 0 }}>
                <Image source={{ uri: item.url }} style={imgStyle(w, h)} />
                {(item.title || item.completed_date || item.note) && (
                    <View style={sc.powMeta}>
                        {item.title ? <Text style={sc.powMetaTitle}>{item.title}</Text> : null}
                        {item.completed_date ? (
                            <Text style={sc.powMetaDate}>Completed: {formatDate(item.completed_date)}</Text>
                        ) : null}
                        {item.note ? <Text style={sc.powMetaNote}>{item.note}</Text> : null}
                    </View>
                )}
            </View>
        );
    };

    return (
        <>
            {items.length === 0 && (
                <View style={sc.powEmpty}>
                    <Text style={sc.powEmptyIcon}>📷</Text>
                    <Text style={sc.powEmptyText}>Proof of Work coming soon.</Text>
                    <Text style={sc.powEmptyHint}>This steward is building their public portfolio.</Text>
                </View>
            )}
            <View style={{ opacity: items.length === 0 ? 0.5 : 1 }}>
                <ItemCard item={paddedItems[0]} w={INNER} h={200} />
                <View style={{ height: GAP }} />
                <View style={[sc.row, { marginBottom: GAP }]}>
                    <ItemCard item={paddedItems[1]} w={HALF} h={140} />
                    <View style={{ width: GAP }} />
                    <ItemCard item={paddedItems[2]} w={HALF} h={140} />
                </View>
                <View style={sc.row}>
                    <ItemCard item={paddedItems[3]} w={HALF} h={140} />
                    <View style={{ width: GAP }} />
                    <ItemCard item={paddedItems[4]} w={HALF} h={140} />
                </View>
            </View>
        </>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BusinessProfileScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [profile, setProfile] = useState<BusinessProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Lead form state
    const [isRequesting, setIsRequesting] = useState(false);
    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadService, setLeadService] = useState('');
    const [leadMessage, setLeadMessage] = useState('');
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (!slug) { setLoading(false); setError('Profile slug not provided.'); return; }

        const fetchProfile = async () => {
            setLoading(true); setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/public/${slug}`);
                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`Error ${res.status}: ${txt}`);
                }
                const d = await res.json();
                setProfile({
                    slug: d.slug,
                    name: d.name,
                    category: clean(d.business_category_key),
                    provider_type: clean(d.provider_type),
                    business_line: clean(d.business_line),
                    short_bio: clean(d.short_bio),
                    location_string: clean(d.location) ?? clean(d.operating_area),
                    operating_area: clean(d.operating_area),
                    address_label: clean(d.address_label),
                    province: clean(d.province),
                    city: clean(d.city),
                    suburb: clean(d.suburb),
                    service_radius_km: d.service_radius_km ?? null,
                    service_area_notes: clean(d.service_area_notes),
                    whatsapp_number: clean(d.whatsapp_number) ?? clean(d.phone),
                    availability: clean(d.availability),
                    cover_photo_url: clean(d.cover_photo_url),
                    logo_url: clean(d.logo_url),
                    proof_items: parseProofOfWorkItems(d.proof_of_work_items, d.supporting_image_urls),
                    services: parseServices(d.services),
                    created_at: d.created_at ?? null,
                });
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'An error occurred.');
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [slug]);

    const handleWhatsApp = () => {
        if (!profile?.whatsapp_number) return;
        const msg = encodeURIComponent(
            `Hi ${profile.name}, I found your profile on iPhande and would like to request a service.`
        );
        let p = profile.whatsapp_number.replace(/[^0-9]/g, '');
        if (p.startsWith('0')) p = '27' + p.substring(1);
        Linking.openURL(`https://wa.me/${p}?text=${msg}`);
    };

    const submitLead = async () => {
        if (!leadName.trim() || !leadPhone.trim()) {
            setSubmitError('Name and Phone are required.');
            return;
        }
        setSubmitStatus('submitting'); setSubmitError('');
        try {
            const res = await fetch(`${API_BASE_URL}/leads`, {
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
            if (!res.ok) throw new Error((await res.text()) || 'Failed to submit.');
            setSubmitStatus('success');
        } catch (e: unknown) {
            setSubmitStatus('error');
            setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5D7A5A" />
                <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>🔍</Text>
                <Text style={styles.errorTitle}>Profile not found</Text>
                <Text style={styles.errorText}>{error ?? 'This steward profile does not exist.'}</Text>
            </View>
        );
    }

    const otherServices = profile.business_line
        ? profile.services.filter((s) => s !== profile.business_line)
        : profile.services;
    const avail = getAvailabilityDisplay(profile.availability);
    const joinDate = formatJoinDate(profile.created_at);
    const hasOperatingArea =
        profile.operating_area || profile.address_label ||
        profile.province || profile.city || profile.suburb ||
        profile.service_radius_km || profile.service_area_notes;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* ── HERO ─────────────────────────────────────────────────────── */}
            <View style={styles.heroContainer}>
                {profile.cover_photo_url ? (
                    <Image source={{ uri: profile.cover_photo_url }} style={styles.heroImage} />
                ) : (
                    <View style={[styles.heroImage, styles.heroPlaceholder]}>
                        <Text style={styles.heroPlaceholderText}>iPhande</Text>
                    </View>
                )}
            </View>

            {/* ── IDENTITY ─────────────────────────────────────────────────── */}
            <View style={styles.identityCenter}>
                <View style={styles.avatarRing}>
                    {profile.logo_url ? (
                        <Image source={{ uri: profile.logo_url }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarInitials}>
                            {profile.name?.substring(0, 2).toUpperCase() ?? 'ST'}
                        </Text>
                    )}
                </View>
                <Text style={styles.businessName}>{profile.name}</Text>
                {profile.provider_type ? (
                    <Text style={styles.providerType}>{profile.provider_type}</Text>
                ) : null}
                {profile.category ? (
                    <Text style={styles.categoryTag}>
                        {profile.category.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                ) : null}
                {profile.location_string ? (
                    <Text style={styles.locationText}>📍 {profile.location_string}</Text>
                ) : null}
            </View>

            {/* ── CTA BUTTONS ──────────────────────────────────────────────── */}
            <View style={styles.ctaRow}>
                {profile.whatsapp_number ? (
                    <TouchableOpacity
                        style={styles.whatsappBtn}
                        onPress={handleWhatsApp}
                        accessibilityLabel="Contact via WhatsApp"
                    >
                        <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                    style={[styles.requestBtn, !profile.whatsapp_number && styles.requestBtnFull]}
                    onPress={() => setIsRequesting(!isRequesting)}
                    accessibilityLabel="Request a service"
                >
                    <Text style={styles.requestBtnText}>📝 Request Service</Text>
                </TouchableOpacity>
            </View>

            {/* ── REQUEST FORM ─────────────────────────────────────────────── */}
            {isRequesting && (
                <View style={styles.formCard}>
                    {submitStatus === 'success' ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successIcon}>✅</Text>
                            <Text style={styles.successTitle}>Request Sent!</Text>
                            <Text style={styles.successText}>
                                {profile.name} will contact you soon.
                            </Text>
                            <TouchableOpacity
                                style={styles.closeFormBtn}
                                onPress={() => { setIsRequesting(false); setSubmitStatus('idle'); }}
                            >
                                <Text style={styles.closeFormBtnText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.formTitle}>Request a Service</Text>
                            <Text style={styles.label}>Your Name *</Text>
                            <TextInput style={styles.input} value={leadName} onChangeText={setLeadName}
                                placeholder="Jane Doe" placeholderTextColor="#9EAD9B" autoCapitalize="words" />
                            <Text style={styles.label}>Your Phone *</Text>
                            <TextInput style={styles.input} value={leadPhone} onChangeText={setLeadPhone}
                                placeholder="082 123 4567" placeholderTextColor="#9EAD9B" keyboardType="phone-pad" />
                            <Text style={styles.label}>Service Needed</Text>
                            <TextInput style={styles.input} value={leadService} onChangeText={setLeadService}
                                placeholder="e.g. Website development" placeholderTextColor="#9EAD9B" />
                            <Text style={styles.label}>Message</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={leadMessage}
                                onChangeText={setLeadMessage}
                                placeholder="Any details that will help…" placeholderTextColor="#9EAD9B"
                                multiline numberOfLines={3} textAlignVertical="top" />
                            {submitStatus === 'error' && (
                                <Text style={styles.formError}>{submitError}</Text>
                            )}
                            <TouchableOpacity
                                style={[styles.submitBtn, submitStatus === 'submitting' && styles.submitBtnDisabled]}
                                onPress={submitLead}
                                disabled={submitStatus === 'submitting'}
                                accessibilityLabel="Submit service request"
                            >
                                <Text style={styles.submitBtnText}>
                                    {submitStatus === 'submitting' ? 'Sending…' : 'Send Request'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            {/* ── FEATURED SERVICE ─────────────────────────────────────────── */}
            {(profile.business_line || profile.services.length > 0) && (
                <View style={styles.section}>
                    <SectionHeader
                        title="Services"
                        subtitle="What this steward specialises in."
                    />
                    {profile.business_line && (
                        <>
                            <Text style={styles.featuredServiceLabel}>PRIMARY SERVICE</Text>
                            <View style={styles.featuredServicePill}>
                                <Text style={styles.featuredServiceText}>{profile.business_line}</Text>
                            </View>
                        </>
                    )}
                    {otherServices.length > 0 && (
                        <>
                            {profile.business_line && (
                                <Text style={styles.otherServicesLabel}>OTHER SERVICES</Text>
                            )}
                            <View style={styles.pillRow}>
                                {otherServices.map((s, i) => (
                                    <View key={i} style={styles.pill}>
                                        <Text style={styles.pillText}>✓ {s}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* ── STORY ────────────────────────────────────────────────────── */}
            <View style={styles.section}>
                <SectionHeader
                    title="The Story"
                    subtitle="Who this steward is and what drives their work."
                />
                <View style={styles.storyCard}>
                    <Text style={styles.storyText}>
                        {profile.short_bio ?? 'No story provided yet.'}
                    </Text>
                </View>
            </View>

            {/* ── PROOF OF WORK ────────────────────────────────────────────── */}
            <View style={[styles.section, { paddingHorizontal: PAD }]}>
                <SectionHeader
                    title="Proof of Work"
                    subtitle="Evidence of completed work, service quality, and trust."
                />
                <ProofGallery items={profile.proof_items} />
            </View>

            {/* ── TRUST RECORD ─────────────────────────────────────────────── */}
            <View style={styles.section}>
                <SectionHeader
                    title="Trust Record"
                    subtitle="A track record built through real work."
                />
                <View style={styles.trustGrid}>
                    {joinDate ? (
                        <View style={styles.trustItem}>
                            <Text style={styles.trustValue}>🗓</Text>
                            <Text style={styles.trustLabel}>Steward Since</Text>
                            <Text style={styles.trustSub}>{joinDate}</Text>
                        </View>
                    ) : null}
                    <View style={styles.trustItem}>
                        <Text style={styles.trustValue}>—</Text>
                        <Text style={styles.trustLabel}>Quotes Issued</Text>
                        <Text style={styles.trustSub}>Coming soon</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Text style={styles.trustValue}>—</Text>
                        <Text style={styles.trustLabel}>Jobs Completed</Text>
                        <Text style={styles.trustSub}>Coming soon</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Text style={styles.trustValue}>—</Text>
                        <Text style={styles.trustLabel}>Customer Requests</Text>
                        <Text style={styles.trustSub}>Coming soon</Text>
                    </View>
                </View>
            </View>

            {/* ── OPERATING AREA ───────────────────────────────────────────── */}
            {hasOperatingArea && (
                <View style={styles.section}>
                    <SectionHeader
                        title="Operating Area"
                        subtitle="Where this steward works and serves customers."
                    />
                    <View style={styles.areaCard}>
                        {/* Location string */}
                        {profile.location_string && (
                            <View style={styles.areaRow}>
                                <Text style={styles.areaIcon}>📍</Text>
                                <Text style={styles.areaText}>{profile.location_string}</Text>
                            </View>
                        )}
                        {/* Province / City / Suburb pills */}
                        {(profile.province || profile.city || profile.suburb) && (
                            <View style={[styles.pillRow, { marginTop: 12 }]}>
                                {profile.province ? (
                                    <View style={styles.areaPill}>
                                        <Text style={styles.areaPillText}>{profile.province}</Text>
                                    </View>
                                ) : null}
                                {profile.city ? (
                                    <View style={styles.areaPill}>
                                        <Text style={styles.areaPillText}>{profile.city}</Text>
                                    </View>
                                ) : null}
                                {profile.suburb ? (
                                    <View style={styles.areaPill}>
                                        <Text style={styles.areaPillText}>{profile.suburb}</Text>
                                    </View>
                                ) : null}
                            </View>
                        )}
                        {/* Address label */}
                        {profile.address_label && (
                            <View style={[styles.areaRow, { marginTop: 10 }]}>
                                <Text style={styles.areaIcon}>🏠</Text>
                                <Text style={styles.areaText}>{profile.address_label}</Text>
                            </View>
                        )}
                        {/* Service radius */}
                        {profile.service_radius_km ? (
                            <View style={[styles.areaRow, { marginTop: 10 }]}>
                                <Text style={styles.areaIcon}>🔵</Text>
                                <Text style={styles.areaText}>
                                    Serves within {profile.service_radius_km} km
                                </Text>
                            </View>
                        ) : null}
                        {/* Service area notes */}
                        {profile.service_area_notes && (
                            <Text style={[styles.storyText, { marginTop: 12, fontStyle: 'normal' }]}>
                                {profile.service_area_notes}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* ── AVAILABILITY ─────────────────────────────────────────────── */}
            <View style={styles.section}>
                <SectionHeader
                    title="Availability"
                    subtitle="Current work status."
                />
                <View style={[styles.availCard, { borderColor: avail.color + '40' }]}>
                    <View style={[styles.availDot, { backgroundColor: avail.color }]} />
                    <View>
                        <Text style={[styles.availStatus, { color: avail.color }]}>
                            {avail.icon} {avail.label}
                        </Text>
                        <Text style={styles.availHint}>
                            Contact the steward to confirm scheduling.
                        </Text>
                    </View>
                </View>
            </View>

            {/* ── BOTTOM REQUEST CTA ───────────────────────────────────────── */}
            <View style={styles.bottomCta}>
                <Text style={styles.bottomCtaTitle}>Ready to work with {profile.name}?</Text>
                <TouchableOpacity
                    style={styles.requestBtnLarge}
                    onPress={() => {
                        setIsRequesting(true);
                        // scroll to top handled by user
                    }}
                    accessibilityLabel="Request service from bottom of profile"
                >
                    <Text style={styles.requestBtnLargeText}>📝 Request a Service</Text>
                </TouchableOpacity>
                {profile.whatsapp_number && (
                    <TouchableOpacity style={styles.waBottomBtn} onPress={handleWhatsApp}>
                        <Text style={styles.waBottomBtnText}>💬 or message on WhatsApp</Text>
                    </TouchableOpacity>
                )}
            </View>

        </ScrollView>
    );
}

// ─── Shared section-card styles ───────────────────────────────────────────────

const sc = StyleSheet.create({
    sectionHeader: { alignItems: 'center', marginBottom: 20 },
    sectionTitle: {
        fontSize: 11, fontWeight: '800', color: '#9EAD9B',
        textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 4,
    },
    sectionSubtitle: { fontSize: 13, color: '#6F7D75', textAlign: 'center', lineHeight: 18 },
    powMeta: { paddingTop: 10, paddingBottom: 14 },
    powMetaTitle: { fontSize: 15, fontWeight: '700', color: '#24352F', marginBottom: 2 },
    powMetaDate: { fontSize: 12, color: '#9EAD9B', marginBottom: 4 },
    powMetaNote: { fontSize: 13, color: '#6F7D75', lineHeight: 18 },
    powEmpty: {
        backgroundColor: '#FFFDF8', borderRadius: 16, padding: 36,
        alignItems: 'center', borderWidth: 1.5, borderColor: '#E8DFD0', borderStyle: 'dashed',
    },
    powEmptyIcon: { fontSize: 32, marginBottom: 12 },
    powEmptyText: { fontSize: 15, fontWeight: '700', color: '#6F7D75', marginBottom: 6 },
    powEmptyHint: { fontSize: 13, color: '#9EAD9B', textAlign: 'center' },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F3EA' },
    content: { paddingBottom: 80, maxWidth: 600, alignSelf: 'center', width: '100%' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F3EA' },
    loadingText: { marginTop: 12, fontSize: 15, color: '#6F7D75' },
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
    identityCenter: {
        alignItems: 'center', marginTop: -60, paddingHorizontal: 20,
        zIndex: 10, paddingBottom: 8,
    },
    avatarRing: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#FFFDF8', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
        borderWidth: 3, borderColor: '#F7F3EA',
    },
    avatar: { width: 112, height: 112, borderRadius: 56 },
    avatarInitials: { fontSize: 38, fontWeight: '800', color: '#5D7A5A' },
    businessName: { fontSize: 26, fontWeight: '800', color: '#24352F', marginTop: 14, textAlign: 'center', letterSpacing: 0.3 },
    providerType: { fontSize: 15, color: '#24352F', fontWeight: '600', marginTop: 4, textAlign: 'center' },
    categoryTag: { fontSize: 11, color: '#5D7A5A', fontWeight: '700', marginTop: 4, letterSpacing: 1.2, textAlign: 'center' },
    locationText: { fontSize: 14, color: '#6F7D75', marginTop: 6, fontWeight: '500' },

    // CTAs
    ctaRow: { flexDirection: 'row', paddingHorizontal: PAD, marginTop: 28, gap: 12 },
    whatsappBtn: {
        flex: 1, backgroundColor: '#25D366', paddingVertical: 15, borderRadius: 14, alignItems: 'center',
        shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    whatsappBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
    requestBtn: {
        flex: 1, backgroundColor: '#24352F', paddingVertical: 15, borderRadius: 14, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    requestBtnFull: { flex: 1 },
    requestBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },

    // Form
    formCard: {
        marginHorizontal: PAD, marginTop: 24, backgroundColor: '#FFFDF8',
        padding: 22, borderRadius: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    formTitle: { fontSize: 19, fontWeight: '800', color: '#24352F', marginBottom: 18 },
    label: { fontSize: 11, fontWeight: '800', color: '#9EAD9B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: {
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8DFD0',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: '#24352F', marginBottom: 14,
    },
    textArea: { height: 90, paddingTop: 12 },
    submitBtn: { backgroundColor: '#5D7A5A', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 6 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    formError: { color: '#C0392B', fontSize: 13, marginBottom: 12, fontWeight: '600' },
    successBox: { alignItems: 'center', paddingVertical: 24 },
    successIcon: { fontSize: 36, marginBottom: 12 },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#5D7A5A', marginBottom: 8 },
    successText: { fontSize: 15, color: '#6F7D75', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    closeFormBtn: { backgroundColor: '#E8DFD0', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10 },
    closeFormBtnText: { color: '#24352F', fontWeight: '700', fontSize: 14 },

    // Generic section wrapper
    section: { marginTop: 36, paddingHorizontal: PAD },

    // Featured Service
    featuredServiceLabel: { fontSize: 10, fontWeight: '800', color: '#9EAD9B', letterSpacing: 1.5, marginBottom: 8 },
    featuredServicePill: {
        backgroundColor: '#24352F', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14,
        alignSelf: 'flex-start', marginBottom: 16,
    },
    featuredServiceText: { color: '#FFFDF8', fontWeight: '800', fontSize: 16 },
    otherServicesLabel: { fontSize: 10, fontWeight: '800', color: '#9EAD9B', letterSpacing: 1.5, marginBottom: 8 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
        backgroundColor: '#EDF3EC', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
        borderWidth: 1, borderColor: '#C5D9C2',
    },
    pillText: { fontSize: 13, color: '#3D5E3A', fontWeight: '600' },

    // Story
    storyCard: {
        backgroundColor: '#FFFDF8', borderRadius: 16, padding: 20,
        borderLeftWidth: 3, borderLeftColor: '#5D7A5A',
    },
    storyText: { fontSize: 15, fontStyle: 'italic', color: '#24352F', lineHeight: 24 },

    // Trust Record
    trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    trustItem: {
        flex: 1, minWidth: '44%', backgroundColor: '#FFFDF8', borderRadius: 14,
        padding: 16, alignItems: 'center',
        borderWidth: 1, borderColor: '#E8DFD0',
    },
    trustValue: { fontSize: 22, fontWeight: '800', color: '#24352F', marginBottom: 4 },
    trustLabel: { fontSize: 11, fontWeight: '700', color: '#9EAD9B', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginBottom: 2 },
    trustSub: { fontSize: 11, color: '#9EAD9B', textAlign: 'center' },

    // Operating Area
    areaCard: {
        backgroundColor: '#FFFDF8', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#E8DFD0',
    },
    areaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    areaIcon: { fontSize: 16, marginTop: 1 },
    areaText: { flex: 1, fontSize: 15, color: '#24352F', lineHeight: 22 },
    areaPill: {
        backgroundColor: '#EDF3EC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: '#C5D9C2',
    },
    areaPillText: { fontSize: 13, color: '#3D5E3A', fontWeight: '600' },

    // Availability
    availCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#FFFDF8', borderRadius: 16, padding: 20,
        borderWidth: 1.5,
    },
    availDot: { width: 14, height: 14, borderRadius: 7, flexShrink: 0 },
    availStatus: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
    availHint: { fontSize: 12, color: '#9EAD9B' },

    // Bottom CTA
    bottomCta: {
        marginTop: 48, marginHorizontal: PAD, paddingBottom: 32,
        alignItems: 'center',
    },
    bottomCtaTitle: {
        fontSize: 18, fontWeight: '800', color: '#24352F',
        textAlign: 'center', marginBottom: 16, lineHeight: 26,
    },
    requestBtnLarge: {
        width: '100%', backgroundColor: '#5D7A5A', paddingVertical: 18,
        borderRadius: 16, alignItems: 'center', marginBottom: 12,
        shadowColor: '#5D7A5A', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    requestBtnLargeText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
    waBottomBtn: { paddingVertical: 12 },
    waBottomBtnText: { fontSize: 15, color: '#25D366', fontWeight: '700' },
});
