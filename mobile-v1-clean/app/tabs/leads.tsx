import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { fetchWithAuth } from '../../config/api';
import { useSteward } from '../../src/state/StewardContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';

interface Lead {
    id: string;
    name: string;
    phone: string;
    message?: string;
    service_needed?: string;
    customer_location?: string;
    status: LeadStatus;
    source?: string;
    profile_slug?: string;
    created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; icon: string }> = {
    new:       { label: 'New',       bg: '#FEF3C7', text: '#D97706', icon: '🆕' },
    contacted: { label: 'Contacted', bg: '#DBEAFE', text: '#1D4ED8', icon: '📞' },
    quoted:    { label: 'Quoted',    bg: '#E0E7FF', text: '#3730A3', icon: '📄' },
    won:       { label: 'Won',       bg: '#D1FAE5', text: '#065F46', icon: '✅' },
    lost:      { label: 'Lost',      bg: '#FEE2E2', text: '#991B1B', icon: '❌' },
};

const formatDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString('en-ZA', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch {
        return iso;
    }
};

const formatTime = (iso: string): string => {
    try {
        return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
};

const openWhatsApp = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '27' + clean.substring(1);
    const msg = encodeURIComponent(`Hi ${name}, this is your iPhande steward following up on your service request.`);
    Linking.openURL(`https://wa.me/${clean}?text=${msg}`);
};

// ─── Lead Card ────────────────────────────────────────────────────────────────

interface LeadCardProps {
    lead: Lead;
    onUpdate: (id: string, status: LeadStatus) => Promise<void>;
    onCreateQuote: (lead: Lead) => void;
}

function LeadCard({ lead, onUpdate, onCreateQuote }: LeadCardProps) {
    const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
    const isTerminal = lead.status === 'won' || lead.status === 'lost';

    return (
        <View style={[styles.card, isTerminal && styles.cardTerminal]}>

            {/* Header row: status badge + date */}
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeText, { color: cfg.text }]}>
                        {cfg.icon} {cfg.label}
                    </Text>
                </View>
                <View style={styles.dateBlock}>
                    <Text style={styles.dateText}>{formatDate(lead.created_at)}</Text>
                    <Text style={styles.timeText}>{formatTime(lead.created_at)}</Text>
                </View>
            </View>

            {/* Customer identity */}
            <Text style={styles.customerName}>{lead.name}</Text>
            <View style={styles.phoneRow}>
                <Text style={styles.phoneText}>📱 {lead.phone}</Text>
                {lead.customer_location ? (
                    <Text style={styles.locationText}>📍 {lead.customer_location}</Text>
                ) : null}
            </View>

            {/* Service needed */}
            {lead.service_needed ? (
                <View style={styles.serviceBox}>
                    <Text style={styles.serviceLabel}>SERVICE NEEDED</Text>
                    <Text style={styles.serviceText}>{lead.service_needed}</Text>
                </View>
            ) : null}

            {/* Customer message */}
            {lead.message ? (
                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>"{lead.message}"</Text>
                </View>
            ) : null}

            {/* Source tag */}
            {lead.source && lead.source !== 'public_profile' ? (
                <Text style={styles.sourceTag}>via {lead.source}</Text>
            ) : null}

            {/* Actions — only for active leads */}
            {!isTerminal && (
                <View style={styles.actionsBlock}>
                    <View style={styles.divider} />

                    {/* Row 1: WhatsApp + Create Quote (always available) */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.waBtn}
                            onPress={() => openWhatsApp(lead.phone, lead.name)}
                            accessibilityLabel={`Contact ${lead.name} on WhatsApp`}
                        >
                            <Text style={styles.waBtnText}>💬 WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quoteBtn}
                            onPress={() => onCreateQuote(lead)}
                            accessibilityLabel={`Create quote for ${lead.name}`}
                        >
                            <Text style={styles.quoteBtnText}>📄 Create Quote</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Row 2: Status transitions */}
                    <View style={styles.actionRow}>
                        {lead.status === 'new' && (
                            <TouchableOpacity
                                style={styles.secondaryBtn}
                                onPress={() => onUpdate(lead.id, 'contacted')}
                                accessibilityLabel="Mark this lead as contacted"
                            >
                                <Text style={styles.secondaryBtnText}>📞 Mark Contacted</Text>
                            </TouchableOpacity>
                        )}

                        {(lead.status === 'contacted' || lead.status === 'quoted') && (
                            <>
                                <TouchableOpacity
                                    style={styles.wonBtn}
                                    onPress={() =>
                                        Alert.alert(
                                            'Mark as Won?',
                                            `This will close the lead for ${lead.name} as a successful job.`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Mark Won', onPress: () => onUpdate(lead.id, 'won') },
                                            ]
                                        )
                                    }
                                    accessibilityLabel="Mark lead as won"
                                >
                                    <Text style={styles.wonBtnText}>✅ Won</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.lostBtn}
                                    onPress={() =>
                                        Alert.alert(
                                            'Mark as Lost?',
                                            `This will close the lead for ${lead.name}.`,
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Mark Lost', style: 'destructive', onPress: () => onUpdate(lead.id, 'lost') },
                                            ]
                                        )
                                    }
                                    accessibilityLabel="Mark lead as lost"
                                >
                                    <Text style={styles.lostBtnText}>✗ Lost</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* Terminal state closure */}
            {isTerminal && (
                <View style={styles.terminalRow}>
                    <Text style={styles.terminalText}>
                        {lead.status === 'won'
                            ? '✅ This lead was successfully won.'
                            : '❌ This lead was closed as lost.'}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ slug }: { slug?: string }) {
    const router = useRouter();
    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No leads yet.</Text>
            <Text style={styles.emptyBody}>
                Share your Visibility link to start receiving customer requests.
                When someone fills out your request form, they will appear here.
            </Text>
            {slug ? (
                <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => router.push(`/public/${slug}` as `/${string}`)}
                    accessibilityLabel="Preview your public profile"
                >
                    <Text style={styles.emptyBtnText}>👁 Preview My Visibility</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeadsScreen() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updateInProgress, setUpdateInProgress] = useState<string | null>(null);
    const router = useRouter();
    const { profile } = useSteward();

    const fetchLeads = useCallback(async () => {
        try {
            const data = await fetchWithAuth('/leads/me');
            setLeads(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch leads error:', error);
            // Don't Alert — show empty state gracefully instead
            setLeads([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const onRefresh = () => { setRefreshing(true); fetchLeads(); };

    const updateStatus = async (id: string, status: LeadStatus) => {
        setUpdateInProgress(id);
        try {
            await fetchWithAuth(`/leads/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            // Optimistic update
            setLeads((prev) =>
                prev.map((l) => (l.id === id ? { ...l, status } : l))
            );
        } catch (error) {
            console.error('Update lead error:', error);
            Alert.alert('Error', 'Could not update lead status. Please try again.');
            // Revert by re-fetching
            fetchLeads();
        } finally {
            setUpdateInProgress(null);
        }
    };

    const handleCreateQuote = (lead: Lead) => {
        router.push({
            pathname: '/tools/calculator',
            params: {
                leadId: lead.id,
                name: lead.name,
                phone: lead.phone,
                service: lead.service_needed ?? lead.message ?? '',
            },
        });
    };

    // Separate active from closed leads
    const activeLeads = leads.filter((l) => l.status !== 'won' && l.status !== 'lost');
    const closedLeads = leads.filter((l) => l.status === 'won' || l.status === 'lost');

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5D7A5A" />
                <Text style={styles.loadingText}>Loading leads…</Text>
            </View>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5D7A5A" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.kicker}>Pipeline</Text>
                <Text style={styles.title}>Leads & Requests</Text>
                <Text style={styles.subtitle}>
                    Customer requests from your public profile.
                </Text>
                {leads.length > 0 && (
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryChip}>
                            <Text style={styles.summaryChipText}>
                                {activeLeads.length} active
                            </Text>
                        </View>
                        {closedLeads.length > 0 && (
                            <View style={[styles.summaryChip, styles.summaryChipClosed]}>
                                <Text style={[styles.summaryChipText, styles.summaryChipTextClosed]}>
                                    {closedLeads.length} closed
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Empty state */}
            {leads.length === 0 && (
                <EmptyState slug={profile?.slug} />
            )}

            {/* Active leads */}
            {activeLeads.length > 0 && (
                <View style={styles.section}>
                    {activeLeads.map((lead) => (
                        <View key={lead.id} style={updateInProgress === lead.id && styles.updating}>
                            <LeadCard
                                lead={lead}
                                onUpdate={updateStatus}
                                onCreateQuote={handleCreateQuote}
                            />
                        </View>
                    ))}
                </View>
            )}

            {/* Closed leads */}
            {closedLeads.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionKicker}>Closed</Text>
                    {closedLeads.map((lead) => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onUpdate={updateStatus}
                            onCreateQuote={handleCreateQuote}
                        />
                    ))}
                </View>
            )}

        </ScrollView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { paddingBottom: 60 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },

    // Header
    header: {
        paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32,
        backgroundColor: '#F9FAFB',
    },
    kicker: {
        fontSize: 12, fontWeight: '800', color: '#9CA3AF',
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
    },
    title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', lineHeight: 24 },
    summaryRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    summaryChip: {
        backgroundColor: '#EDF3EC', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: '#C5D9C2',
    },
    summaryChipText: { fontSize: 13, fontWeight: '700', color: '#3D5E3A' },
    summaryChipClosed: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
    summaryChipTextClosed: { color: '#6B7280' },

    section: { padding: 20, gap: 16 },
    sectionKicker: {
        fontSize: 11, fontWeight: '800', color: '#9CA3AF',
        letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 4,
    },
    updating: { opacity: 0.6 },

    // Card
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
    },
    cardTerminal: { opacity: 0.75 },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 14,
    },
    badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    dateBlock: { alignItems: 'flex-end' },
    dateText: { fontSize: 12, color: '#9EAD9B', fontWeight: '600' },
    timeText: { fontSize: 11, color: '#C5D9C2', marginTop: 1 },

    customerName: { fontSize: 20, fontWeight: '800', color: '#24352F', marginBottom: 6 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' },
    phoneText: { fontSize: 14, color: '#6F7D75', fontWeight: '500' },
    locationText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },

    serviceBox: {
        backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#F3F4F6',
    },
    serviceLabel: {
        fontSize: 10, fontWeight: '800', color: '#9EAD9B',
        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
    },
    serviceText: { fontSize: 15, fontWeight: '700', color: '#24352F' },

    messageBox: {
        backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 10,
    },
    messageText: { fontSize: 14, color: '#4B5563', fontStyle: 'italic', lineHeight: 20 },
    sourceTag: { fontSize: 11, color: '#9EAD9B', marginBottom: 6 },

    // Action block
    actionsBlock: { marginTop: 4 },
    divider: { height: 1, backgroundColor: '#F0F5EF', marginVertical: 14 },
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },

    waBtn: {
        flex: 1, backgroundColor: '#10B981', paddingVertical: 14,
        borderRadius: 12, alignItems: 'center',
    },
    waBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    quoteBtn: {
        flex: 1, backgroundColor: '#111827', paddingVertical: 14,
        borderRadius: 12, alignItems: 'center',
    },
    quoteBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    secondaryBtn: {
        flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 14,
        borderRadius: 12, alignItems: 'center',
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    secondaryBtnText: { color: '#3D5E3A', fontWeight: '700', fontSize: 14 },

    wonBtn: {
        flex: 1, backgroundColor: '#D1FAE5', paddingVertical: 12,
        borderRadius: 10, alignItems: 'center',
        borderWidth: 1, borderColor: '#6EE7B7',
    },
    wonBtnText: { color: '#065F46', fontWeight: '800', fontSize: 14 },

    lostBtn: {
        flex: 1, backgroundColor: '#fff', paddingVertical: 12,
        borderRadius: 10, alignItems: 'center',
        borderWidth: 1, borderColor: '#FCA5A5',
    },
    lostBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },

    terminalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    terminalText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

    // Empty state
    emptyContainer: {
        margin: 24, padding: 36, backgroundColor: '#FFFFFF',
        borderRadius: 16, alignItems: 'center',
        borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
    },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#24352F', marginBottom: 10 },
    emptyBody: {
        fontSize: 15, color: '#6F7D75', textAlign: 'center',
        lineHeight: 22, marginBottom: 24,
    },
    emptyBtn: {
        backgroundColor: '#24352F', paddingVertical: 14, paddingHorizontal: 28,
        borderRadius: 14, alignItems: 'center',
    },
    emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
