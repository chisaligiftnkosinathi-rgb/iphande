import { Link } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSteward } from '../../src/context/StewardContext';

// ─── Visibility Score Computation ─────────────────────────────────────────────

interface ScoreItem {
    label: string;
    done: boolean;
    hint?: string;
}

const parseSupportingImagesCount = (v: unknown): number => {
    if (Array.isArray(v)) return (v as string[]).filter(Boolean).length;
    if (typeof v !== 'string' || !v.trim()) return 0;
    try {
        const p = JSON.parse(v);
        if (Array.isArray(p)) return p.filter(Boolean).length;
    } catch { /* fall through */ }
    // strip '""' edge case
    const s = v.trim().replace(/^"+|"+$/g, '').trim();
    if (!s) return 0;
    return s.split(',').map((x) => x.trim()).filter(Boolean).length;
};

const computeVisibilityScore = (profile: Record<string, unknown> | null): { score: number; items: ScoreItem[] } => {
    if (!profile) return { score: 0, items: [] };

    const clean = (x: unknown): boolean => {
        if (!x) return false;
        const s = String(x).trim();
        return s !== '' && s.toLowerCase() !== 'none' && s !== 'null';
    };

    const imageCount = parseSupportingImagesCount(profile.supporting_image_urls);

    const items: ScoreItem[] = [
        { label: 'Name',           done: clean(profile.name),             hint: 'Set your stewardship name.' },
        { label: 'Phone / WhatsApp', done: clean(profile.phone) || clean(profile.whatsapp_number), hint: 'Add a contact number so customers can reach you.' },
        { label: 'Services',       done: clean(profile.services),          hint: 'List at least one service you offer.' },
        { label: 'Location',       done: clean(profile.location) || clean(profile.operating_area), hint: 'Set your working location.' },
        { label: 'Story',          done: clean(profile.short_bio),         hint: 'Add a bio — who you are and what you do.' },
        { label: 'Proof of Work (3+ images)', done: imageCount >= 3,     hint: `You have ${imageCount}/3 images. Add ${Math.max(0, 3 - imageCount)} more.` },
        { label: 'Availability',   done: clean(profile.availability),      hint: 'Set your current work status.' },
        { label: 'Operating Area', done: clean(profile.operating_area) || clean(profile.address_label), hint: 'Specify where you work.' },
    ];

    const doneCount = items.filter((i) => i.done).length;
    const score = Math.round((doneCount / items.length) * 100);
    return { score, items };
};

const getScoreColor = (score: number): string => {
    if (score >= 80) return '#2E7D32';
    if (score >= 50) return '#E65100';
    return '#C62828';
};

// ─── Components ───────────────────────────────────────────────────────────────

export default function VisibilityScreen() {
    const { profile } = useSteward();
    const p = profile as Record<string, unknown> | null;

    const services: string[] = typeof p?.services === 'string'
        ? p.services.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

    let proofImages: string[] = [];
    if (p?.supporting_image_urls) {
        if (Array.isArray(p.supporting_image_urls)) {
            proofImages = p.supporting_image_urls as string[];
        } else if (typeof p.supporting_image_urls === 'string') {
            try {
                const parsed = JSON.parse(p.supporting_image_urls);
                if (Array.isArray(parsed)) proofImages = parsed;
                else proofImages = [p.supporting_image_urls];
            } catch {
                proofImages = p.supporting_image_urls.split(',').map((u: string) => u.trim()).filter(Boolean);
            }
        }
    }
    // Strip empty JSON strings like '""'
    proofImages = proofImages.filter((u) => u && u !== '""');

    const { score, items } = computeVisibilityScore(p);
    const scoreColor = getScoreColor(score);
    const completedCount = items.filter((i) => i.done).length;

    return (
        <ScrollView style={styles.container}>

            {/* ── HEADER ──────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <Text style={styles.kicker}>Visibility Engine</Text>
                <Text style={styles.title}>Your Public Profile</Text>
                <Text style={styles.subtitle}>
                    This is what customers see. Build it to build trust.
                </Text>
            </View>

            {/* ── VISIBILITY SCORE CARD ───────────────────────────────────── */}
            <View style={styles.section}>
                <View style={styles.scoreCard}>
                    <View style={styles.scoreHeader}>
                        <View>
                            <Text style={styles.scoreLabel}>Visibility Score</Text>
                            <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}% Complete</Text>
                        </View>
                        <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                            <Text style={styles.scoreBadgeText}>{completedCount}/{items.length}</Text>
                        </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${score}%` as `${number}%`, backgroundColor: scoreColor }]} />
                    </View>
                    <Text style={styles.progressHint}>
                        {score < 50 ? 'Keep going — customers need more to trust you.' :
                         score < 80 ? 'Good progress. A few more items and you\'ll stand out.' :
                                      'Excellent visibility! Customers can trust you immediately.'}
                    </Text>

                    <View style={styles.divider} />

                    {/* Checklist */}
                    {items.map((item, idx) => (
                        <View key={idx} style={styles.checkRow}>
                            <View style={[styles.checkIcon, item.done ? styles.checkIconDone : styles.checkIconTodo]}>
                                <Text style={[styles.checkIconText, item.done ? styles.checkIconTextDone : styles.checkIconTextTodo]}>
                                    {item.done ? '✓' : '✗'}
                                </Text>
                            </View>
                            <View style={styles.checkContent}>
                                <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>
                                    {item.label}
                                </Text>
                                {!item.done && item.hint && (
                                    <Text style={styles.checkHint}>{item.hint}</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* ── PROFILE PREVIEW CARD ────────────────────────────────────── */}
            <View style={styles.section}>
                <Text style={styles.sectionKicker}>Profile Preview</Text>
                <View style={styles.card}>
                    {p?.cover_photo_url ? (
                        <Image source={{ uri: String(p.cover_photo_url) }} style={styles.coverImage} />
                    ) : (
                        <View style={styles.coverPlaceholder}>
                            <Text style={styles.coverPlaceholderText}>No cover photo</Text>
                        </View>
                    )}
                    <View style={styles.cardHeader}>
                        <View style={styles.logoRing}>
                            {p?.logo_url ? (
                                <Image source={{ uri: String(p.logo_url) }} style={styles.logoImage} />
                            ) : (
                                <Text style={styles.logoText}>{String(p?.name ?? 'B').substring(0, 2).toUpperCase()}</Text>
                            )}
                        </View>
                        <View style={styles.businessInfo}>
                            <Text style={styles.businessName}>{String(p?.name ?? 'Your Business Name')}</Text>
                            <Text style={styles.businessCategory}>
                                {String(p?.business_category_key ?? 'Category not set').replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>

                    {/* Story */}
                    <Text style={styles.sectionHeading}>Story</Text>
                    <Text style={styles.paragraph}>
                        {String(p?.short_bio ?? 'No story added yet. Tell people who you are.')}
                    </Text>

                    <View style={styles.divider} />

                    {/* Primary Service */}
                    {typeof p?.business_line === 'string' && p.business_line && (
                        <>
                            <Text style={styles.sectionHeading}>Primary Service</Text>
                            <View style={styles.primaryPill}>
                                <Text style={styles.primaryPillText}>{p.business_line}</Text>
                            </View>
                            <View style={styles.divider} />
                        </>
                    )}

                    {/* All Services */}
                    <Text style={styles.sectionHeading}>Services</Text>
                    <View style={styles.pillRow}>
                        {services.length > 0 ? services.map((s, i) => (
                            <View key={i} style={styles.pill}>
                                <Text style={styles.pillText}>{s}</Text>
                            </View>
                        )) : (
                            <Text style={styles.paragraph}>No services added yet.</Text>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Contact & Location */}
                    <Text style={styles.sectionHeading}>Contact & Location</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>WhatsApp</Text>
                        <Text style={styles.infoValue}>
                            {String(p?.whatsapp_number ?? p?.phone ?? 'Not set')}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>
                            {String(p?.location ?? p?.operating_area ?? 'Not set')}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Availability */}
                    <Text style={styles.sectionHeading}>Availability</Text>
                    <Text style={styles.paragraph}>
                        {String(p?.availability ?? 'Not set — add your current status.')}
                    </Text>

                    <View style={styles.divider} />

                    {/* Proof of Work */}
                    <Text style={styles.sectionHeading}>
                        Proof of Work ({proofImages.length}/5)
                    </Text>
                    {proofImages.length < 3 && (
                        <View style={styles.powGovernance}>
                            <Text style={styles.powGovernanceText}>
                                📷 Add at least {3 - proofImages.length} more image{proofImages.length < 2 ? 's' : ''} to complete your Visibility Score.
                            </Text>
                        </View>
                    )}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                        {proofImages.length > 0 ? proofImages.map((url, idx) => (
                            <Image key={idx} source={{ uri: url }} style={styles.galleryImage} />
                        )) : (
                            <Text style={styles.paragraph}>Add Proof of Work images to build trust.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* ── ACTIONS ─────────────────────────────────────────────────── */}
            <View style={styles.actions}>
                <Link href="/onboarding" asChild>
                    <TouchableOpacity style={styles.primaryBtn} accessibilityLabel="Edit your profile">
                        <Text style={styles.primaryBtnText}>✏️ Edit Visibility</Text>
                    </TouchableOpacity>
                </Link>
                <Link href={`/public/${p?.slug ?? ''}`} asChild>
                    <TouchableOpacity style={styles.secondaryBtn} accessibilityLabel="Preview your public profile">
                        <Text style={styles.secondaryBtnText}>👁 Preview Public Profile</Text>
                    </TouchableOpacity>
                </Link>
            </View>

        </ScrollView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    header: {
        padding: 24, paddingTop: 52, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    kicker: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 6 },
    subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },

    section: { padding: 24 },
    sectionKicker: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },

    // Score card
    scoreCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    scoreLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
    scoreValue: { fontSize: 24, fontWeight: '800' },
    scoreBadge: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    scoreBadgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    progressTrack: {
        height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 10,
    },
    progressFill: { height: '100%', borderRadius: 4 },
    progressHint: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 12 },
    checkIcon: {
        width: 24, height: 24, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1,
    },
    checkIconDone: { backgroundColor: '#D1FAE5' },
    checkIconTodo: { backgroundColor: '#FEE2E2' },
    checkIconText: { fontSize: 12, fontWeight: '800' },
    checkIconTextDone: { color: '#059669' },
    checkIconTextTodo: { color: '#DC2626' },
    checkContent: { flex: 1 },
    checkLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
    checkLabelDone: { color: '#111827' },
    checkHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2, lineHeight: 16 },

    // Profile card
    card: {
        backgroundColor: '#fff', padding: 24, borderRadius: 16,
        borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    },
    coverImage: { width: '100%', height: 120, borderRadius: 12, marginBottom: 16, backgroundColor: '#E5E7EB', resizeMode: 'cover' },
    coverPlaceholder: { width: '100%', height: 80, borderRadius: 12, marginBottom: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    coverPlaceholderText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 14 },
    logoRing: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
    },
    logoImage: { width: 56, height: 56, borderRadius: 28 },
    logoText: { fontSize: 20, fontWeight: '700', color: '#6B7280' },
    businessInfo: { flex: 1 },
    businessName: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 2 },
    businessCategory: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

    sectionHeading: {
        fontSize: 11, fontWeight: '800', color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10,
    },
    paragraph: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 4 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 18 },
    infoRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
    infoLabel: { width: 80, fontSize: 14, fontWeight: '600', color: '#6B7280' },
    infoValue: { flex: 1, fontSize: 14, color: '#111827' },

    primaryPill: {
        alignSelf: 'flex-start', backgroundColor: '#111827',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 8,
    },
    primaryPillText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
        backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    },
    pillText: { fontSize: 13, fontWeight: '600', color: '#374151' },

    // Proof governance
    powGovernance: {
        backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 12,
        borderWidth: 1, borderColor: '#FCD34D',
    },
    powGovernanceText: { fontSize: 13, color: '#92400E', fontWeight: '600', lineHeight: 18 },
    galleryScroll: { flexDirection: 'row', marginBottom: 4 },
    galleryImage: { width: 120, height: 90, borderRadius: 8, marginRight: 10, backgroundColor: '#E5E7EB', resizeMode: 'cover' },

    // Actions
    actions: { paddingHorizontal: 24, paddingBottom: 56, gap: 12 },
    primaryBtn: {
        backgroundColor: '#111827', paddingVertical: 17, borderRadius: 14, alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    secondaryBtn: {
        backgroundColor: '#fff', paddingVertical: 17, borderRadius: 14,
        borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
    },
    secondaryBtnText: { color: '#111827', fontWeight: '700', fontSize: 16 },
});
