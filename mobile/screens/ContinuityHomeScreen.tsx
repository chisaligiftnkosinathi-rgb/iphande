import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/ui/AppHeader';
import { useAuth } from '../src/auth/AuthContext';

const RIVER_JOURNEY = [
    'Observe',
    'Preserve',
    'Replay',
    'Learn',
    'Serve',
    'Continue',
];

const PRIMARY_ACTIONS = [
    { title: 'Complete Profile', description: 'Build your identity', route: 'Profile' },
    { title: 'Capture Opportunity', description: 'Record work, leads or needs', route: 'Opportunities' },
    { title: 'Continue My Journey', description: 'View timeline replay', route: 'Timeline' },
];

export default function ContinuityHomeScreen() {
    const navigation = useNavigation<any>();
    const { user, profile } = useAuth() as any;

    let firstName = 'Steward';
    if (user?.displayName) {
        firstName = user.displayName.split(' ')[0];
    } else if (profile?.full_name || profile?.name) {
        const fullName = profile.full_name || profile.name;
        firstName = fullName.split(' ')[0];
    } else if (user?.email) {
        const prefix = user.email.split('@')[0];
        firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    return (
        <View style={{ flex: 1 }}>
            <AppHeader title="Continuity Home" showBack={false} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>

                <View style={styles.heroCard}>
                    <Text style={styles.title}>Hello {firstName} 👋</Text>
                    <Text style={styles.heroDescription}>
                        Preserving your work, relationships and opportunities.
                    </Text>
                    <View style={styles.mantraBox}>
                        <Text style={styles.mantraText}>Your story matters.</Text>
                        <Text style={styles.mantraText}>Your work matters.</Text>
                        <Text style={styles.mantraText}>Your continuity matters.</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Continuity Snapshot</Text>
                    <View style={styles.snapshotGrid}>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotValue}>{profile ? '1' : '0'}</Text>
                            <Text style={styles.snapshotLabel}>Profile</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotValue}>--</Text>
                            <Text style={styles.snapshotLabel}>Events</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotValue}>--</Text>
                            <Text style={styles.snapshotLabel}>Opps</Text>
                        </View>
                        <View style={styles.snapshotItem}>
                            <Text style={styles.snapshotValue}>--</Text>
                            <Text style={styles.snapshotLabel}>People</Text>
                        </View>
                    </View>
                    <Text style={styles.truthNote}>Metrics aggregation pending API integration.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>What would you like to do today?</Text>
                    <View style={styles.startHereList}>
                        {PRIMARY_ACTIONS.map((card) => (
                            <Pressable
                                key={card.route}
                                style={styles.primaryActionCard}
                                onPress={() => navigation.navigate(card.route as never)}
                            >
                                <Text style={styles.primaryActionTitle}>{card.title}</Text>
                                <Text style={styles.primaryActionDescription}>{card.description}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Recent Continuity</Text>
                    <View style={styles.dashedBox}>
                        <Text style={styles.dashedBoxText}>No activity yet.{'\n\n'}Capture your first opportunity or complete your profile to begin your continuity journey.</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Daily Reflection</Text>
                    <View style={styles.reflectionBox}>
                        <Text style={styles.reflectionText}>Your work matters because people matter.</Text>
                        <Text style={styles.scriptureText}>"Whatever you do, work heartily, as for the Lord."</Text>
                        <Text style={styles.scriptureReference}>— Colossians 3:23</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>The River Journey</Text>
                    <View style={styles.riverVertical}>
                        {RIVER_JOURNEY.map((step, index) => (
                            <React.Fragment key={step}>
                                <View style={styles.riverStepBox}>
                                    <Text style={styles.riverStepText}>{step}</Text>
                                </View>
                                {index < RIVER_JOURNEY.length - 1 && (
                                    <Text style={styles.riverArrowDown}>↓</Text>
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAF7',
    },
    content: {
        padding: 20,
    },
    heroCard: {
        backgroundColor: '#1E3A2F',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    heroDescription: {
        fontSize: 15,
        color: '#D1FAE5',
        lineHeight: 22,
    },
    mantraBox: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#3E6B57',
    },
    mantraText: {
        color: '#A7F3D0',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    snapshotGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 16,
    },
    snapshotItem: {
        alignItems: 'center',
        flex: 1,
    },
    snapshotValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#102A20',
        marginBottom: 4,
    },
    snapshotLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
        textTransform: 'uppercase',
    },
    riverVertical: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    riverStepBox: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 999,
        minWidth: 160,
        alignItems: 'center',
    },
    riverStepText: {
        color: '#1F5A42',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    riverArrowDown: {
        color: '#34D399',
        fontSize: 24,
        fontWeight: '900',
        marginVertical: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    riverFooter: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: '600',
        color: '#102A20',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    truthNote: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 16,
        lineHeight: 20,
    },
    dashedBox: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    dashedBoxText: {
        textAlign: 'center',
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 13,
    },
    startHereList: {
    },
    primaryActionCard: {
        backgroundColor: '#1E3A2F',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    primaryActionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    primaryActionDescription: {
        fontSize: 13,
        color: '#D1FAE5',
    },
    reflectionBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    reflectionText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#92400E',
        marginBottom: 8,
    },
    scriptureText: {
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 22,
        color: '#78350F',
        marginBottom: 8,
    },
    scriptureReference: {
        fontSize: 12,
        fontWeight: '800',
        color: '#92400E',
        textAlign: 'right',
    },
});
