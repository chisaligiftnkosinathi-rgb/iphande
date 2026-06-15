import { ScrollView, StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About iPhande</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.hero}>
                    <Text style={styles.title}>iPhande</Text>
                    <Text style={styles.subtitle}>Work remembered. Trust preserved.</Text>
                    <Text style={[styles.subtitle, {marginTop: 4, fontWeight: '600', color: '#111827'}]}>Umuntu Ngumuntu Ngabantu.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Our Mission</Text>
                    <Text style={styles.cardText}>
                        iPhande exists to preserve proof of work and build dignity. Too often, skilled individuals 
                        do great work but have no digital record to prove it. iPhande changes this by allowing 
                        stewards to upload proof of their completed work, creating a verifiable portfolio that builds trust.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>The Core Principle</Text>
                    <Text style={styles.cardQuote}>
                        "Free to enter. Free to be seen. Free to find each other. Paid when someone needs business power."
                    </Text>
                    <Text style={styles.cardText}>
                        Anyone can browse the public community and find local services. Anyone can post an opportunity. 
                        But when a steward wants to send professional quotes, issue invoices, and track their business math, 
                        they activate their profile with a verifiable R120 payment proof.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Powered By</Text>
                    <Text style={styles.cardText}>
                        Powered by <Text style={{fontWeight: '700'}}>Global IT and Business Solutions</Text>. 
                        We believe that technology should empower local economies and bring structure to the informal sector.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 60,
    },
    hero: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    cardQuote: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3B82F6', // Blue to stand out
        fontStyle: 'italic',
        lineHeight: 26,
        marginBottom: 16,
        paddingLeft: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    }
});
