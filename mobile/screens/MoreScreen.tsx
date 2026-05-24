import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { navigateTo, RootTabParamList } from '../navigation';

type MoreItem = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  target: keyof RootTabParamList;
};

const items: MoreItem[] = [
  { title: 'My Profile', description: 'Identity and account presence', icon: 'person-outline', target: 'Profile' },
  { title: 'Campaigns', description: 'Outreach and growth work', icon: 'megaphone-outline', target: 'Campaigns' },
  { title: 'Generated Content', description: 'Review, approve, and share posts', icon: 'checkmark-done-outline', target: 'GeneratedContent' },
  { title: 'Quote Requests', description: 'Manage all quote requests', icon: 'mail-outline', target: 'QuoteRequestsDashboard' },
  { title: 'Stewardship', description: 'Cash, profit, and obligations', icon: 'wallet-outline', target: 'StewardshipLedger' },
  { title: 'Payment Review', description: 'Review evidence before receipts', icon: 'receipt-outline', target: 'PaymentReview' },
  { title: 'Giving / Support', description: 'Voluntary giving and support', icon: 'heart-outline', target: 'GivingSupport' },
  { title: 'Media Library', description: 'Images, videos and documents', icon: 'images-outline', target: 'Media' },
  { title: 'Reflections', description: 'Lessons and activity notes', icon: 'journal-outline', target: 'Reflections' },
  { title: 'Scripture', description: 'Daily encouragement', icon: 'book-outline', target: 'Scripture' },
  { title: 'Templates', description: 'Reusable messages', icon: 'document-text-outline', target: 'Templates' },
];

const MoreScreen: React.FC = () => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>IP</Text>
        </View>

        <Text style={styles.eyebrow}>Account & Workspace</Text>
        <Text style={styles.title}>More</Text>
        <Text style={styles.description}>
          Access your profile, media, reflections, templates, scripture notes, and supporting workspace tools.
        </Text>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable key={item.title} style={styles.itemCard} onPress={() => navigateTo(item.target)}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={25} color="#1E3A2F" />
            </View>

            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </Pressable>
        ))}
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
