import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CORE_CONTINUITY_SCREENS, getScreensForArchetype } from '../data/archetypeScreenAccess';
import { navigateTo } from '../navigation';
import { useAuth } from '../src/auth/AuthContext';
import { fetchProfileByOwner } from '../src/services/apiClient';

type ToolStatus = 'active' | 'preview' | 'pending';

type ToolItem = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  target: string;
  status: ToolStatus;
};

const TOOL_REGISTRY: Record<string, ToolItem> = {
  Profile: { title: 'My Profile', description: 'Identity and account presence', icon: 'person-outline', target: 'Profile', status: 'active' },
  Media: { title: 'Media Library', description: 'Images, videos and documents', icon: 'images-outline', target: 'Media', status: 'active' },
  Timeline: { title: 'Replay Timeline', description: 'Observe and trace continuity', icon: 'time-outline', target: 'Timeline', status: 'active' },
  AboutUs: { title: 'About Us', description: 'Global IT and Business Solutions', icon: 'information-circle-outline', target: 'AboutUs', status: 'active' },
  Acknowledgements: { title: 'Acknowledgements', description: 'Gratitude and recognition', icon: 'heart-half-outline', target: 'Acknowledgements', status: 'active' },
  Music: { title: 'Music', description: 'Inspirational media', icon: 'musical-notes-outline', target: 'Music', status: 'active' },
  ContinuityPrinciples: { title: 'Principles', description: 'Our continuity values', icon: 'shield-checkmark-outline', target: 'ContinuityPrinciples', status: 'active' },
  Support: { title: 'Support', description: 'Get help and guidance', icon: 'help-buoy-outline', target: 'Support', status: 'active' },

  // Archetype Tools
  InventoryLedger: { title: 'Inventory Ledger', description: 'Stock movements and balances', icon: 'cube-outline', target: 'InventoryLedger', status: 'active' },
  GivingSupport: { title: 'Giving / Support', description: 'Voluntary giving and support', icon: 'heart-outline', target: 'GivingSupport', status: 'active' },
  QuoteRequestsDashboard: { title: 'Quote Requests', description: 'Manage all incoming quote requests', icon: 'mail-outline', target: 'QuoteRequestsDashboard', status: 'active' },
  ContentGenerator: { title: 'Content Generator', description: 'AI-assisted communication', icon: 'flash-outline', target: 'ContentGenerator', status: 'active' },
  Campaigns: { title: 'Campaigns', description: 'Outreach and growth work', icon: 'megaphone-outline', target: 'Campaigns', status: 'preview' },
  Opportunities: { title: 'Opportunities', description: 'Track business leads and actions', icon: 'briefcase-outline', target: 'Opportunities', status: 'active' },
  DocumentComposer: { title: 'Document Composer', description: 'Draft contextual documents', icon: 'document-text-outline', target: 'DocumentComposer', status: 'preview' },
  LeadQuoteCapture: { title: 'Lead Capture', description: 'Capture incoming policy leads', icon: 'person-add-outline', target: 'LeadQuoteCapture', status: 'active' },
  CommissionLedger: { title: 'Commission Ledger', description: 'Pipeline vs Cash Reality', icon: 'bar-chart-outline', target: 'CommissionLedger', status: 'active' },
  PaymentReview: { title: 'Evidence Review', description: 'Review payment and document evidence', icon: 'receipt-outline', target: 'PaymentReview', status: 'preview' },
};

const StatusBadge = ({ status }: { status: ToolStatus }) => {
  let bgColor = '#F3F4F6';
  let textColor = '#6B7280';
  if (status === 'active') {
    bgColor = '#DCFCE7';
    textColor = '#166534';
  } else if (status === 'preview') {
    bgColor = '#FEF3C7';
    textColor = '#92400E';
  }
  return (
    <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.statusText, { color: textColor }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

const MoreScreen: React.FC = () => {
  const { stewardId, selectedBusinessArchetypeKey } = useAuth() as any;
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (stewardId) {
      fetchProfileByOwner(stewardId)
        .then(setProfile)
        .catch(() => console.log('Profile sync pending for MoreScreen tools'));
    }
  }, [stewardId]);

  const activeArchetypeKey = profile?.business_category_key || selectedBusinessArchetypeKey || 'default';
  const allowedScreens = Array.from(new Set(getScreensForArchetype(activeArchetypeKey)));

  const coreTools = allowedScreens
    .filter(screen => CORE_CONTINUITY_SCREENS.includes(screen) && TOOL_REGISTRY[screen])
    .map(screen => TOOL_REGISTRY[screen]);

  const archetypeTools = allowedScreens
    .filter(screen => !CORE_CONTINUITY_SCREENS.includes(screen) && TOOL_REGISTRY[screen])
    .map(screen => TOOL_REGISTRY[screen]);

  const renderToolGrid = (tools: ToolItem[]) => (
    <View style={styles.grid}>
      {tools.map((item) => (
        <Pressable key={item.title} style={styles.itemCard} onPress={() => navigateTo(item.target as any)}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={24} color="#1E3A2F" />
            </View>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>IP</Text>
        </View>

        <Text style={styles.eyebrow}>Account & Workspace</Text>
        <Text style={styles.title}>More</Text>
        <Text style={styles.description}>
          Access your core continuity memory and archetype-specific operational tools.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Identity & Memory</Text>
        {renderToolGrid(coreTools)}
      </View>

      {archetypeTools.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operational Archetype Tools</Text>
          {renderToolGrid(archetypeTools)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAF7' },
  content: { padding: 20, gap: 16 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#1E3A2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 12 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '900' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F6B4F',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: { fontSize: 34, fontWeight: '900', color: '#102A20', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 23, color: '#4B5563', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: {
    width: '48%',
    minHeight: 158,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  itemTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 8 },
  itemDescription: { fontSize: 13, lineHeight: 19, color: '#6B7280' },
});

export default MoreScreen;
