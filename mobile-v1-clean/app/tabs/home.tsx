import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';
import { STEWARD_TOOL_REGISTRY, ToolKey } from '../../src/domain/stewardToolRegistry';
import { DashboardStats, getAdminDashboard } from '../../src/services/adminApi';
import { computeVisibilityScore } from './visibility';

interface Tool {
    key: ToolKey;
    name: string;
    desc: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    route: string;
}

const ALL_TOOLS: Record<ToolKey, Tool> = {
    'quote_builder': { key: 'quote_builder', name: "Quote Builder", desc: "Prepare service quotes", icon: "calculator-outline", route: "/tools/calculator" },
    'documents': { key: 'documents', name: "Documents", desc: "Saved quotes & invoices", icon: "folder-open-outline", route: "/tools/documents" },
    'proof_of_work': { key: 'proof_of_work', name: "Proof of Work", desc: "Record completed work", icon: "checkmark-done-outline", route: "/tools/proof-of-work" },
    'inventory_tracker': { key: 'inventory_tracker', name: "Inventory", desc: "Track material costs", icon: "cube-outline", route: "/tools/inventory-tracker" },
    'km_tracker': { key: 'km_tracker', name: "Mileage Tracker", desc: "Log business travel km", icon: "car-outline", route: "/tools/km-tracker" },
    'notebook': { key: 'notebook', name: "Notebook", desc: "Record quick text notes", icon: "book-outline", route: "/tools/notebook" },
    'referrals': { key: 'referrals', name: "Referral Program", desc: "Invite stewards & earn ZAR", icon: "people-outline", route: "/tools/referrals" },
    // TODO: Add all other tools from the old static list to complete this mapping
    'materials_calculator': { key: 'materials_calculator', name: "Materials", desc: "Calculate material costs", icon: "build-outline", route: "/tools/calculator" },
    'travel_calculator': { key: 'travel_calculator', name: "Travel", desc: "Calculate travel costs", icon: "map-outline", route: "/tools/km-tracker" },
    'before_after_proof': { key: 'before_after_proof', name: "Before/After Proof", desc: "Capture work progress", icon: "camera-reverse-outline", route: "/tools/proof-of-work" },
    'expense_tracker': { key: 'expense_tracker', name: "Expenses", desc: "Track business expenses", icon: "receipt-outline", route: "/tools/expenses" }, // Assuming an expenses tool exists
    'lead_tracker': { key: 'lead_tracker', name: "Lead Tracker", desc: "Manage customer leads", icon: "people-circle-outline", route: "/tabs/leads" },
    'commission_calculator': { key: 'commission_calculator', name: "Commission", desc: "Calculate sales commission", icon: "cash-outline", route: "/tools/calculator" },
    'whatsapp_followup': { key: 'whatsapp_followup', name: "WhatsApp Follow-up", desc: "Engage with customers", icon: "logo-whatsapp", route: "/tabs/leads" },
    'receipt_capture': { key: 'receipt_capture', name: "Receipt Capture", desc: "Scan and save receipts", icon: "receipt-outline", route: "/tools/expenses" },
    'project_milestone_tracker': { key: 'project_milestone_tracker', name: "Project Milestones", desc: "Track project progress", icon: "flag-outline", route: "/tools/milestones" },
    'document_generator': { key: 'document_generator', name: "Documents", desc: "Generate project documents", icon: "document-text-outline", route: "/tools/documents" },
    'vba_console': { key: 'vba_console', name: "VBA Console", desc: "Access Visual Business Automation", icon: "terminal-outline", route: "/tools/vba" },
};

export default function HomeScreen() {
    const { profile, refreshProfile } = useSteward();
    const { width } = useWindowDimensions();
    const router = useRouter();

    const [leadsCount, setLeadsCount] = useState<number | null>(null);
    const [openOpportunities, setOpenOpportunities] = useState<number | null>(null);
    const [proofUploadsCount, setProofUploadsCount] = useState<number | null>(null);
    const [timelineActivityCount, setTimelineActivityCount] = useState<number | null>(null);
    const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
    const [visibleTools, setVisibleTools] = useState<Tool[]>([]);

    const [refreshing, setRefreshing] = useState(false);

    const isAdmin = profile?.role === 'admin' || profile?.role === 'system_admin' || profile?.trust_posture === 'system_creator';
    const isCreator = profile?.trust_posture === 'system_creator';

    const { score: visibilityScore } = computeVisibilityScore(profile as Record<string, unknown> | null);

    useEffect(() => {
        if (profile?.archetype) {
            const toolSet = STEWARD_TOOL_REGISTRY[profile.archetype] ?? STEWARD_TOOL_REGISTRY['general'];
            const tools = toolSet.tools.map(key => ALL_TOOLS[key]).filter(Boolean); // Filter out any undefined tools
            setVisibleTools(tools);
        }
    }, [profile?.archetype]);


    const fetchData = async () => {
        try {
            const leadsData = await fetchWithAuth('/leads/me');
            const leads = leadsData || [];
            const activeLeads = leads.filter((lead: any) =>
                lead.status === 'new' || lead.status === 'contacted' || lead.status === 'quote_requested' || lead.status === 'quoted'
            );
            setLeadsCount(activeLeads.length);
        } catch { setLeadsCount(null); }

        if (!profile?.id) return;

        try {
            const oppsData = await fetchWithAuth('/opportunities');
            const opps = oppsData || [];
            setOpenOpportunities(opps.length);
        } catch { setOpenOpportunities(null); }

        try {
            const eventsData = await fetchWithAuth(`/continuity-events/business/${profile.id}`);
            const events = eventsData || [];
            setTimelineActivityCount(events.length);

            const proofEvents = events.filter((e: any) => e.event_type === 'evidence_captured');
            setProofUploadsCount(proofEvents.length);
        } catch {
            setTimelineActivityCount(null);
            setProofUploadsCount(null);
        }

        if (isAdmin) {
            try {
                const statsData = await getAdminDashboard();
                setAdminStats(statsData);
            } catch (err) {
                console.warn("Failed to fetch admin dashboard stats:", err);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [profile?.id]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshProfile().catch(err => console.warn(err));
        await fetchData();
        setRefreshing(false);
    };

    const isActivationApproved = profile?.setup_fee_status === "approved" && profile?.is_verified;
    const isPaymentPending = profile?.setup_fee_status === "pending" || profile?.setup_fee_status === "proof_uploaded";

    let activationStatusText = "Pending Activation";
    let activationStatusColor = "#D97706"; // Amber
    if (isActivationApproved || isAdmin) {
        activationStatusText = "Active Profile";
        activationStatusColor = "#059669"; // Green
    } else if (profile?.setup_fee_status === "none" || !profile?.setup_fee_status) {
        activationStatusText = "Awaiting Payment Proof";
        activationStatusColor = "#DC2626"; // Red
    }

    const isWide = width > 768;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.kicker}>Home</Text>
                <Text style={styles.title}>{isCreator ? "System Creator" : "Today's Summary"}</Text>
                <Text style={styles.subtitle}>{isCreator ? "Platform management & owner console." : "Your business at a glance."}</Text>
            </View>

            {/* Profile Status Banner */}
            <View style={styles.section}>
                {isCreator ? (
                    <View style={[styles.statusBanner, { borderLeftColor: "#10B981" }]}>
                        <View style={styles.statusBannerContent}>
                            <Ionicons name="key" size={24} color="#10B981" />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.statusTitle}>Platform Owner</Text>
                                <Text style={styles.statusDesc}>Global IT and Business Solutions</Text>
                                <Text style={[styles.statusDesc, { fontWeight: '700', color: '#111827', marginTop: 2 }]}>
                                    Full Access Enabled • Bootstrap Administration Active
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.statusBanner, { borderLeftColor: activationStatusColor }]}>
                        <View style={styles.statusBannerContent}>
                            <Ionicons
                                name={isActivationApproved ? "checkmark-circle" : "time"}
                                size={24}
                                color={activationStatusColor}
                            />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.statusTitle}>{activationStatusText}</Text>
                                {!isActivationApproved && (
                                    <Text style={styles.statusDesc}>
                                        {isPaymentPending
                                            ? "Your R120 payment proof is being reviewed."
                                            : "Please upload your R120 payment proof to activate your business profile."}
                                    </Text>
                                )}
                            </View>
                        </View>
                        {!isActivationApproved && !isPaymentPending && (
                            <Link href="/payment-verification" asChild>
                                <TouchableOpacity style={styles.uploadProofBtn}>
                                    <Text style={styles.uploadProofBtnText}>Upload Proof</Text>
                                </TouchableOpacity>
                            </Link>
                        )}
                    </View>
                )}
            </View>

            {/* My Business Today / Platform Overview */}
            <View style={styles.section}>
                {isAdmin && (
                    <TouchableOpacity
                        style={styles.adminPortalButton}
                        onPress={() => router.push('/admin')}
                    >
                        <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.adminPortalText}>Admin Portal</Text>
                        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                )}

                <Text style={styles.sectionTitle}>{isCreator ? "Platform Overview" : "My Business Today"}</Text>
                {isCreator ? (
                    <View style={styles.snapshotGrid}>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Total Stewards</Text>
                            <Text style={styles.snapshotValue}>{adminStats?.total_profiles !== undefined ? adminStats.total_profiles : '—'}</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Pending Activations</Text>
                            <Text style={styles.snapshotValue}>{adminStats?.pending_reviews !== undefined ? adminStats.pending_reviews : '—'}</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Active Opportunities</Text>
                            <Text style={styles.snapshotValue}>{adminStats?.total_opportunities !== undefined ? adminStats.total_opportunities : '—'}</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Recent Timeline Events</Text>
                            <Text style={styles.snapshotValue}>{timelineActivityCount !== null ? timelineActivityCount : '—'}</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Open Leads</Text>
                            <Text style={styles.snapshotValue}>{leadsCount !== null ? leadsCount : '—'}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.snapshotGrid}>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Profile Visibility</Text>
                            <Text style={styles.snapshotValue}>{visibilityScore}%</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Active Leads</Text>
                            <Text style={styles.snapshotValue}>{leadsCount !== null ? leadsCount : '—'}</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Open Opportunities</Text>
                            <Text style={styles.snapshotValue}>{openOpportunities !== null ? openOpportunities : '—'}</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotLabel}>Proof Uploads</Text>
                            <Text style={styles.snapshotValue}>{proofUploadsCount !== null ? proofUploadsCount : '—'}</Text>
                        </View>
                    </View>
                )}
                <View style={styles.timelineBox}>
                    <Text style={styles.timelineLabel}>
                        {isCreator
                            ? `Recent Event Telemetry: ${timelineActivityCount !== null ? timelineActivityCount : '—'} platform continuity entries.`
                            : `Recent Timeline Activity: ${timelineActivityCount !== null ? timelineActivityCount : '—'} events recorded`}
                    </Text>
                </View>
            </View>

            {/* Business Tools Grid */}
            <View style={styles.section}>
                <View style={styles.groupContainer}>
                    <Text style={styles.groupTitle}>Business Tools</Text>
                    <View style={[styles.grid, isWide && styles.gridWide]}>
                        {visibleTools.map((tool) => (
                            <Link key={tool.key} href={tool.route as any} asChild>
                                <TouchableOpacity style={StyleSheet.flatten([styles.toolCard, isWide && styles.toolCardWide])}>
                                    <Ionicons name={tool.icon as any} size={22} color="#6B7280" style={styles.toolIcon} />
                                    <View style={styles.toolTextContent}>
                                        <Text style={styles.toolTitle}>{tool.name}</Text>
                                        <Text style={styles.toolDescription}>{tool.desc}</Text>
                                    </View>
                                </TouchableOpacity>
                            </Link>
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        padding: 24,
        paddingTop: 56,
        paddingBottom: 24,
        backgroundColor: '#F9FAFB',
    },
    kicker: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
    section: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    statusBanner: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderLeftWidth: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statusBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    loadingText: {
        fontSize: 16,
        color: '#4B5563',
    },
    adminPortalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    adminPortalText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    statusDesc: {
        fontSize: 13,
        color: '#4B5563',
        marginTop: 2,
    },
    uploadProofBtn: {
        backgroundColor: '#111827',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 12,
    },
    uploadProofBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    snapshotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    snapshotItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        width: '48%', // two columns on mobile
        flexGrow: 1,
    },
    snapshotLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 6,
    },
    snapshotValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    timelineBox: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: 4,
    },
    timelineLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    groupContainer: {
        marginBottom: 36,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 14,
        marginLeft: 4,
    },
    grid: {
        flexDirection: 'column',
        gap: 12,
    },
    gridWide: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    toolCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 84,
    },
    toolCardWide: {
        width: '48%',
    },
    toolIcon: {
        marginRight: 14,
    },
    toolTextContent: {
        flex: 1,
        justifyContent: 'center',
    },
    toolTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    toolDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
});
