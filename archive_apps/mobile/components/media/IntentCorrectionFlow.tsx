import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import theme from '../../theme';
import { StewardButton } from '../ui/StewardButton';

export interface IntentCorrectionFlowProps {
    correctionText: string;
    onCorrectionTextChange: (text: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

export const IntentCorrectionFlow: React.FC<IntentCorrectionFlowProps> = ({
    correctionText,
    onCorrectionTextChange,
    onSubmit,
    onCancel,
}) => (
    <View style={styles.correctionBox}>
        <Text style={styles.sectionTitle}>Correct the System</Text>
        <TextInput
            style={styles.input}
            placeholder="State the correct intent here..."
            placeholderTextColor="#94a3b8"
            multiline
            value={correctionText}
            onChangeText={onCorrectionTextChange}
        />
        <Text style={styles.correctionHelper}>
            Your correction becomes part of continuity. It helps the system learn without erasing history.
        </Text>
        <View style={styles.row}>
            <StewardButton
                title="Cancel"
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
                onPress={onCancel}
            />
            <StewardButton
                title="Submit Correction"
                variant="primary"
                style={{ flex: 1 }}
                onPress={onSubmit}
                disabled={!correctionText.trim()}
            />
        </View>
    </View>
);

const styles = StyleSheet.create({
    correctionBox: {
        backgroundColor: theme.colors.humanSpace.surface,
        padding: theme.layout.spacing.lg,
        borderRadius: theme.layout.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
    },
    sectionTitle: {
        ...theme.typography.heading,
        color: theme.colors.structural.charcoalLight,
        marginBottom: theme.layout.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.humanSpace.background,
        borderWidth: 1,
        borderColor: theme.colors.structural.border,
        borderRadius: theme.layout.radii.sm,
        padding: theme.layout.spacing.md,
        ...theme.typography.body,
        color: theme.colors.structural.charcoal,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: theme.layout.spacing.md,
    },
    correctionHelper: {
        ...theme.typography.caption,
        color: theme.colors.structural.slateMuted,
        fontStyle: 'italic',
        marginBottom: theme.layout.spacing.lg,
    },
    row: {
        flexDirection: 'row',
    },
});
