import React from 'react';

export interface ProfileEvidenceNoticeProps {
    status: string;
    error: string | null;
    suggestedTags: string[];
    profileGuidance: string[];
    lastContent: string;
}

import { StyleSheet, Text, View } from 'react-native';

export const ProfileEvidenceNotice: React.FC<ProfileEvidenceNoticeProps> = ({ status, error, suggestedTags, profileGuidance, lastContent }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.status}>Status: {status}</Text>
            {error ? <Text style={styles.error}>Error: {error}</Text> : null}
            <Text style={styles.label}>Suggested Tags: <Text style={styles.value}>{suggestedTags.join(', ')}</Text></Text>
            <Text style={styles.label}>Profile Guidance: <Text style={styles.value}>{profileGuidance.join(', ')}</Text></Text>
            <Text style={styles.label}>Last Content: <Text style={styles.value}>{lastContent}</Text></Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    status: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    error: {
        color: '#b71c1c',
        marginBottom: 4,
    },
    label: {
        fontWeight: '600',
        marginTop: 4,
    },
    value: {
        fontWeight: '400',
    },
});
