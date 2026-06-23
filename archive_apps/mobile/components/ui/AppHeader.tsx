import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import theme from '../../theme';

interface AppHeaderProps {
    title: string;
    showBack?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack = true }) => {
    const navigation = useNavigation<any>();

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Home');
        }
    };

    return (
        <View style={styles.container}>
            {showBack && (
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={20} color={theme.colors.structural.charcoal} />
                    <Text style={styles.backText}>Back</Text>
                </Pressable>
            )}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.layout.spacing.lg,
        paddingVertical: theme.layout.spacing.md,
        backgroundColor: theme.colors.humanSpace.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.structural.border,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.layout.spacing.md,
        padding: theme.layout.spacing.xs,
    },
    backText: {
        ...theme.typography.bodyStrong,
        color: theme.colors.structural.charcoal,
        marginLeft: theme.layout.spacing.xs,
    },
    title: {
        ...theme.typography.title,
        fontSize: 18,
        color: theme.colors.structural.charcoal,
        flex: 1,
    },
});
