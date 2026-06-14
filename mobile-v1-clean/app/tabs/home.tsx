import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { fetchWithAuth } from '../../src/config/api';
import { useSteward } from '../../src/context/StewardContext';
import { computeVisibilityScore } from './visibility';

export default function HomeScreen() {
    const { profile, refreshProfile } = useSteward();
    const { width } = useWindowDimensions();
    
    const [leadsCount, setLeadsCount] = useState<number | null>(null);
    const [openOpportunities, setOpenOpportunities] = useState<number | null>(null);
    const [draftQuotesCount, setDraftQuotesCount] = useState<number | null>(null);
    const [timelineActivityCount, setTimelineActivityCount] = useState<number | null>(null);
    
    const [refreshing, setRefreshing] = useState(false);

    const { score: visibilityScore } = computeVisibilityScore(profile as Record<string, unknown> | null);

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
            const quotesData = await fetchWithAuth(`/quotes/business/${profile.id}`);
            const quotes = quotesData || [];
            const drafts = quotes.filter((q: any) => q.status === 'issued' || q.status === 'quote_drafted');
            setDraftQuotesCount(drafts.length);
        } catch { setDraftQuotesCount(null); }

        try {
            const eventsData = await fetchWithAuth(`/continuity-events/business/${profile.id}`);
            const events = eventsData || [];
            setTimelineActivityCount(events.length);
        } catch { setTimelineActivityCount(null); }
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

    // Determine Today's Steward Plan
    const stewardPlan = [];

    if (visibilityScore < 80) {
        stewardPlan.push({ title: "Complete Visibility", route: "/tabs/visibility" });
    }
    if ((leadsCount || 0) > 0) {
        stewardPlan.push({ title: "Respond to Leads", route: "/tabs/leads" });
    }
    if ((draftQuotesCount || 0) > 0) {
        stewardPlan.push({ title: "Review Documents", route: "/tools/documents" });
    }
    if (timelineActivityCount === null || timelineActivityCount === 0) {
        stewardPlan.push({ title: "Record Today's Work", route: "/tools/notebook" });
    }
    if (stewardPlan.length < 3) {
        stewardPlan.push({ title: "Find / Create Opportunity", route: "/tabs/index" });
    }

    const finalPlan = stewardPlan.slice(0, 3);

    const isWide = width > 768;

    const renderToolGroup = (title: string, tools: any[]) => (
        <View style={styles.groupContainer} key={title}>
            <Text style={styles.groupTitle}>{title}</Text>
            <View style={[styles.grid, isWide && styles.gridWide]}>
                {tools.map((tool, idx) => (
                    <Link key={idx} href={tool.route as any} asChild>
                        <TouchableOpacity style={StyleSheet.flatten([styles.toolCard, isWide && styles.toolCardWide])}>
                            <Ionicons name={tool.icon} size={22} color="#6B7280" style={styles.toolIcon} />
                            <View style={styles.toolTextContent}>
                                <Text style={styles.toolTitle}>{tool.name}</Text>
                                <Text style={styles.toolDescription}>{tool.desc}</Text>
                            </View>
                        </TouchableOpacity>
                    </Link>
                ))}
            </View>
        </View>
    );

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.kicker}>Home</Text>
                <Text style={styles.title}>Steward Planner</Text>
                <Text style={styles.subtitle}>Your business, ordered mathematically.</Text>
            </View>

            {/* Today's Steward Plan */}
            <View style={styles.section}>
                <View style={styles.planBox}>
                    <Text style={styles.planLabel}>TODAY’S STEWARD PLAN</Text>
                    <View style={styles.planList}>
                        {finalPlan.map((action, idx) => (
                            <Link key={idx} href={action.route as any} asChild>
                                <TouchableOpacity style={StyleSheet.flatten([styles.planActionRow, idx < finalPlan.length - 1 && styles.planActionDivider])}>
                                    <View style={styles.planActionLeft}>
                                        <View style={styles.planActionNumberContainer}>
                                            <Text style={styles.planActionNumber}>{idx + 1}</Text>
                                        </View>
                                        <Text style={styles.planActionTitle}>{action.title}</Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            </Link>
                        ))}
                    </View>
                </View>
            </View>

            {/* My Business Today */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Business Today</Text>
                <View style={styles.snapshotGrid}>
                    <View style={styles.snapshotItem}>
                        <Text style={styles.snapshotLabel}>Visibility</Text>
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
                        <Text style={styles.snapshotLabel}>Draft/Recent Quotes</Text>
                        <Text style={styles.snapshotValue}>{draftQuotesCount !== null ? draftQuotesCount : '—'}</Text>
                    </View>
                </View>
                <View style={styles.timelineBox}>
                    <Text style={styles.timelineLabel}>
                        Recent Activity: {timelineActivityCount !== null ? timelineActivityCount : '—'} records
                    </Text>
                </View>
            </View>

            {/* Steward Console Grid */}
            <View style={styles.section}>
                <View style={styles.groupContainer}>
                    <Text style={styles.groupTitle}>Steward Console</Text>
                    <View style={[styles.grid, isWide && styles.gridWide]}>
                        {[
                            { name: "Today", desc: "Your business summary", icon: "today-outline", route: "/tabs/index" },
                            { name: "Leads", desc: "New and active requests", icon: "people-outline", route: "/tabs/leads" },
                            { name: "Quotes", desc: "Draft and sent proposals", icon: "calculator-outline", route: "/tools/calculator" },
                            { name: "Invoices", desc: "Awaiting payment", icon: "receipt-outline", route: "/tools/documents" },
                            { name: "Receipts", desc: "Payment evidence", icon: "checkmark-done-outline", route: "/tools/documents" },
                            { name: "Expenses", desc: "Business spending", icon: "wallet-outline", route: "/expenses" },
                            { name: "Inventory", desc: "Materials and stock", icon: "cube-outline", route: "/tools/inventory-tracker" },
                            { name: "Proof of Work", desc: "Completed jobs", icon: "camera-outline", route: "/tools/proof-of-work" },
                            { name: "Documents", desc: "All PDFs and records", icon: "folder-outline", route: "/tools/documents" },
                            { name: "Timeline", desc: "Activity memory ledger", icon: "list-outline", route: "/tabs/timeline" }
                        ].map((tool, idx) => (
                            <Link key={idx} href={tool.route as any} asChild>
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
    planBox: {
        backgroundColor: '#111827',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    planLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 16,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    planList: {
        flexDirection: 'column',
    },
    planActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    planActionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    planActionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    planActionNumberContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    planActionNumber: {
        fontSize: 12,
        fontWeight: '800',
        color: '#111827',
    },
    planActionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
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
        marginBottom: 36, // Increased spacing between groups
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
        minHeight: 84, // Consistent card height
    },
    toolCardWide: {
        width: '48%', // 2 columns
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
