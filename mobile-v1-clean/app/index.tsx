import { Link } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';

export default function WelcomeScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.kicker}>iPhande</Text>
                    <Text style={styles.title}>Your work matters.</Text>
                    <Text style={styles.subtitle}>
                        Find trusted local services. Post work opportunities. Help stewards preserve proof of work and build dignity.
                    </Text>

                    <View style={styles.ctaContainer}>
                        <Link href="/explore" style={styles.primaryButton}>
                            Find Local Services
                        </Link>
                        <Link href="/opportunities/new" style={styles.secondaryButton}>
                            Post Opportunity
                        </Link>
                        <Link href="/auth/register" style={styles.tertiaryButton}>
                            Create / Activate My Profile
                        </Link>
                        <Link href="/auth/login" style={styles.loginLink}>
                            Already have an account? Sign In
                        </Link>
                    </View>
                </View>

                {/* What iPhande Does */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What iPhande Does</Text>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Be Seen</Text>
                        <Text style={styles.cardText}>Create a free business profile and let the community find your services.</Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Find Work</Text>
                        <Text style={styles.cardText}>Browse and apply to local opportunities posted by customers in your area.</Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Preserve Proof</Text>
                        <Text style={styles.cardText}>Automate quotes, invoices, and timeline evidence to build a trusted portfolio.</Text>
                    </View>
                </View>

                {/* How It Works */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How It Works</Text>
                    <View style={styles.step}>
                        <Text style={styles.stepNumber}>1</Text>
                        <Text style={styles.stepText}>Register for free and set up your Archetype and Profile.</Text>
                    </View>
                    <View style={styles.step}>
                        <Text style={styles.stepNumber}>2</Text>
                        <Text style={styles.stepText}>Connect with the community through leads and opportunities.</Text>
                    </View>
                    <View style={styles.step}>
                        <Text style={styles.stepNumber}>3</Text>
                        <Text style={styles.stepText}>Start quoting, invoicing, and capturing proof of work seamlessly.</Text>
                    </View>
                </View>
                
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 iPhande. All rights reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    heroSection: {
        marginBottom: 48,
    },
    kicker: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 16,
        lineHeight: 44,
    },
    subtitle: {
        fontSize: 20,
        color: '#4B5563',
        marginBottom: 32,
        lineHeight: 28,
    },
    ctaContainer: {
        gap: 12,
    },
    primaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#111827',
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 16,
        overflow: 'hidden',
    },
    secondaryButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        color: '#111827',
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 16,
        overflow: 'hidden',
    },
    tertiaryButton: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        color: '#4B5563',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
        overflow: 'hidden',
    },
    loginLink: {
        marginTop: 12,
        textAlign: 'center',
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 16,
    },
    section: {
        marginBottom: 48,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#111827',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 36,
        fontWeight: '800',
        fontSize: 16,
        marginRight: 16,
        overflow: 'hidden',
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    footer: {
        marginTop: 24,
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        paddingTop: 24,
        alignItems: 'center',
    },
    footerText: {
        color: '#9CA3AF',
        fontSize: 14,
    }
});
