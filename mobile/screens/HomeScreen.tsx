import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { navigateTo } from '../navigation';




const HomeScreen: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<string>('Individual');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('');
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>IP</Text>
        </View>

        <Text style={styles.eyebrow}>Business Opportunity Workspace</Text>
        <Text style={styles.title}>Welcome to iPhande</Text>
        <Text style={styles.description}>
          Governed workflow for business profile, content, quote requests, and opportunities.
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>System status</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>App shell active • API connection pending</Text>
        </View>
      </View>

      {/* Main workflow cards */}
      <View style={{ marginTop: 18 }}>
        <Pressable style={styles.primaryActionCard} onPress={() => navigateTo('Profile')}>
          <Text style={styles.primaryActionTitle}>My Business Profile</Text>
          <Text style={styles.primaryActionText}>Set up your business identity and details.</Text>
        </Pressable>

        <View style={{ height: 18 }} />

        {/* ContentGenerator is not a main destination. Only accessible from Opportunities flow. */}
        <View style={{ height: 18 }} />

        <Pressable style={styles.primaryActionCard} onPress={() => navigateTo('QuoteRequestsDashboard')}>
          <Text style={styles.primaryActionTitle}>Quote Requests</Text>
          <Text style={styles.primaryActionText}>View and manage all quote requests.</Text>
        </Pressable>

        <View style={{ height: 18 }} />

        <Pressable style={styles.primaryActionCard} onPress={() => navigateTo('Opportunities')}>
          <Text style={styles.primaryActionTitle}>Opportunity Timeline</Text>
          <Text style={styles.primaryActionText}>Track business opportunities and actions.</Text>
        </Pressable>
      </View>
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
  logoMark: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#1E3A2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F6B4F',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#102A20',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F6B4F',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#102A20',
    marginBottom: 18,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    backgroundColor: '#F8FAF7',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#102A20',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  primaryActionCard: {
    backgroundColor: '#102A20',
    borderRadius: 26,
    padding: 24,
  },
  primaryActionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  primaryActionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#D1FAE5',
    marginBottom: 22,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102A20',
  },
  selectedOptionCard: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  selectedTag: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  guestButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#D1FAE5',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default HomeScreen;
