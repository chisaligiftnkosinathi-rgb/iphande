import React from 'react';
import { StyleSheet, View } from 'react-native';
import theme from '../../theme';
import { StewardButton } from '../ui/StewardButton';

export interface DecisionBoundaryProps {
    onApprove: () => void;
    onReject: () => void;
    onCorrect: () => void;
}

export const DecisionBoundary: React.FC<DecisionBoundaryProps> = ({ onApprove, onReject, onCorrect }) => (
    <View style={styles.container}>
        <StewardButton title="Approve Intent" onPress={onApprove} />
        <StewardButton title="Reject Suggestion" variant="secondary" onPress={onReject} />
        <StewardButton title="Correct Understanding" variant="ghost" onPress={onCorrect} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: theme.layout.spacing.md,
        marginBottom: theme.layout.spacing.md,
    },
});
