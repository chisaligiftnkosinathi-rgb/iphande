import { ScrollView, StyleSheet, Text } from 'react-native';
import { sacredTheme } from '../../theme/sacredTheme';

export default function ContactScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>Contact Us</Text>
            <Text style={styles.body}>
                We are here to support your journey as a steward.{'\n\n'}
                Email: support@iphande.com
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: sacredTheme.colors.sand },
    contentContainer: { padding: sacredTheme.spacing.page, maxWidth: 600, alignSelf: 'center', width: '100%' },
    title: { fontSize: sacredTheme.typography.title, fontWeight: 'bold', color: sacredTheme.colors.earth, marginBottom: sacredTheme.spacing.page },
    body: { fontSize: sacredTheme.typography.body, color: sacredTheme.colors.earth, lineHeight: 24 },
});
