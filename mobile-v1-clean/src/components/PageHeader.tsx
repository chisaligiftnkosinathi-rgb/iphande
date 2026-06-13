import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../config/theme';

interface PageHeaderProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
    eyebrow, 
    title, 
    subtitle, 
    showBack = true, 
    onBack 
}) => {
    
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/tabs/home');
            }
        }
    };

    return (
        <View style={styles.container}>
            {showBack && (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} style={styles.backIcon} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            )}
            
            <View style={styles.content}>
                {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 56,
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: theme.colors.background,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingRight: 12,
    },
    backIcon: {
        marginRight: 6,
    },
    backText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    content: {
        justifyContent: 'flex-start',
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.textMuted,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textMuted,
        lineHeight: 24,
    },
});
