import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';

import { ViewStyle } from 'react-native';

export interface WisdomCardProps {
    annotation?: any;
    wisdomText?: string;
    source?: string;
    style?: ViewStyle;
}

export const WisdomCard: React.FC<WisdomCardProps> = ({ annotation, wisdomText, source, style }) => {
    let content = '';
    if (annotation) {
        if (typeof annotation.content === 'string') content = annotation.content;
        else if (typeof annotation.text === 'string') content = annotation.text;
        else content = JSON.stringify(annotation);
    } else if (wisdomText) {
        content = wisdomText;
    }
    return (
        <View style={[styles.card, style]}>
            <Text style={styles.text}>{content}</Text>
            {source && <Text style={styles.text}>Source: {source}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme?.colors?.wisdom?.bg || '#e0e7ff',
        borderRadius: theme?.layout?.radii?.md || 8,
        padding: theme?.layout?.spacing?.lg || 16,
        borderWidth: 1,
        borderColor: theme?.colors?.wisdom?.border || '#6366f1',
        marginBottom: theme?.layout?.spacing?.md || 12,
    },
    text: {
        color: theme?.colors?.wisdom?.text || '#3730a3',
    },
});
