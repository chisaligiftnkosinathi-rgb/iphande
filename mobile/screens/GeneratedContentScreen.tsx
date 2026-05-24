import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { RootTabParamList } from '../navigation';
import { DEMO_BUSINESS_OWNER_ID } from '../src/config/demoIdentity';
import {
    approveContentPost,
    listGeneratedContentPosts,
    rejectContentPost,
    shareContentPost,
} from '../src/services/apiClient';
import type { ContentPost } from '../src/types/api';

type GeneratedContentNavigation = {
    navigate: <Name extends keyof RootTabParamList>(
        name: Name,
        params?: RootTabParamList[Name]
    ) => void;
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    approved: 'Approved',
    rejected: 'Rejected',
    shared: 'Shared',
    deleted: 'Deleted',
};

const GeneratedContentScreen: React.FC = () => {
    const navigation = useNavigation<GeneratedContentNavigation>();
    const [posts, setPosts] = useState<ContentPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionPostId, setActionPostId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadPosts = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorMessage(null);
            const nextPosts = await listGeneratedContentPosts({
                ownerProfileId: DEMO_BUSINESS_OWNER_ID,
            });
            setPosts(nextPosts);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load generated content.');
            setPosts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const updatePost = (updatedPost: ContentPost) => {
        setPosts((currentPosts) =>
            currentPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
    };

    const runAction = async (
        postId: string,
        action: (id: string) => Promise<ContentPost>
    ) => {
        try {
            setActionPostId(postId);
            setErrorMessage(null);
            const updatedPost = await action(postId);
            updatePost(updatedPost);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Content review action failed.');
        } finally {
            setActionPostId(null);
        }
    };

    const renderPost = (post: ContentPost) => {
        const isBusy = actionPostId === post.id;
        const canApprove = post.status === 'draft' || post.status === 'rejected';
        const canReject = post.status === 'draft' || post.status === 'approved';
        const canShare = post.status === 'approved';

        return (
            <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusText}>{statusLabels[post.status] || post.status}</Text>
                    </View>
                    <Text style={styles.channelText}>{post.channel.toUpperCase()}</Text>
                </View>

                <Text style={styles.title}>{post.title}</Text>
                <Text style={styles.metaText}>Blueprint: {post.template_key || 'not recorded'}</Text>
                <Text style={styles.metaText}>Goal: {post.post_type}</Text>
                <Text style={styles.metaText}>Line: {post.business_line}</Text>

                <View style={styles.captionBox}>
                    <Text style={styles.captionText}>{post.body}</Text>
                </View>

                <Text style={styles.label}>CTA</Text>
                <Text style={styles.ctaText}>{post.call_to_action}</Text>

                <View style={styles.actionRow}>
                    <Pressable
                        style={[styles.actionButton, !canApprove && styles.actionButtonDisabled]}
                        disabled={!canApprove || isBusy}
                        onPress={() => runAction(post.id, approveContentPost)}
                    >
                        <Text style={styles.actionButtonText}>Approve</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, styles.rejectButton, !canReject && styles.actionButtonDisabled]}
                        disabled={!canReject || isBusy}
                        onPress={() => runAction(post.id, rejectContentPost)}
                    >
                        <Text style={styles.actionButtonText}>Reject</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, styles.shareButton, !canShare && styles.actionButtonDisabled]}
                        disabled={!canShare || isBusy}
                        onPress={() => runAction(post.id, (id) => shareContentPost(id, post.channel))}
                    >
                        <Text style={styles.actionButtonText}>Share</Text>
                    </Pressable>
                </View>

                <Pressable
                    style={styles.replayButton}
                    onPress={() =>
                        navigation.navigate('EntityReplay', {
                            entityId: post.id,
                            entityType: 'content_post',
                        })
                    }
                >
                    <Text style={styles.replayButtonText}>Open replay lineage</Text>
                </Pressable>
            </View>
        );
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Steward Workspace</Text>
                <Text style={styles.headerTitle}>Generated Content</Text>
                <Text style={styles.description}>
                    Review generated communication before it becomes approved or shared continuity.
                </Text>
            </View>

            <View style={styles.toolbar}>
                <Text style={styles.ownerText}>Owner: {DEMO_BUSINESS_OWNER_ID}</Text>
                <Pressable style={styles.refreshButton} onPress={loadPosts}>
                    <Text style={styles.refreshText}>Refresh</Text>
                </Pressable>
            </View>

            {errorMessage && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            )}

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1E3A2F" />
                </View>
            ) : posts.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No generated content is ready for review.</Text>
                </View>
            ) : (
                posts.map(renderPost)
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F8FAF7' },
    content: { padding: 20, gap: 14 },
    header: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2F6B4F',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#102A20', marginBottom: 8 },
    description: { fontSize: 14, lineHeight: 22, color: '#4B5563' },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
    },
    ownerText: { fontSize: 13, fontWeight: '800', color: '#374151' },
    refreshButton: { backgroundColor: '#1E3A2F', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
    refreshText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    center: { padding: 28, alignItems: 'center' },
    errorBox: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 8, padding: 12 },
    errorText: { color: '#991B1B', fontSize: 13, lineHeight: 20 },
    emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', borderRadius: 8, padding: 22 },
    emptyText: { color: '#64748B', textAlign: 'center', fontWeight: '700' },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusPill: { backgroundColor: '#DCFCE7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    statusText: { color: '#166534', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    channelText: { color: '#6B7280', fontSize: 11, fontWeight: '900' },
    title: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 },
    metaText: { fontSize: 12, color: '#4B5563', marginBottom: 4 },
    captionBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 12, marginBottom: 12 },
    captionText: { fontSize: 14, lineHeight: 22, color: '#111827' },
    label: { fontSize: 11, fontWeight: '900', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
    ctaText: { fontSize: 13, lineHeight: 20, color: '#374151', marginBottom: 14 },
    actionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    actionButton: {
        flex: 1,
        minHeight: 42,
        borderRadius: 8,
        backgroundColor: '#1E3A2F',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    rejectButton: { backgroundColor: '#7F1D1D' },
    shareButton: { backgroundColor: '#111827' },
    actionButtonDisabled: { backgroundColor: '#9CA3AF' },
    actionButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
    replayButton: {
        borderWidth: 1,
        borderColor: '#111827',
        borderRadius: 8,
        minHeight: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    replayButtonText: { color: '#111827', fontSize: 12, fontWeight: '900' },
});

export default GeneratedContentScreen;
