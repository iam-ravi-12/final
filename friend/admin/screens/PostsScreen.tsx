import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/constants/AppTheme';
import adminService from '../services/adminService';
import api from '@/services/api';
import communityService, { CommunityResponse, CommunityPostResponse } from '@/services/communityService';
import { PostResponse } from '@/services/postService'; // Just in case, or we use direct mapping
import AdminHeader from '../components/AdminHeader';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';
import { formatRelativeDate } from '@/utils/helpers';

export default function PostsScreen() {
  const { colors } = useAppTheme();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'user' | 'community'>('user');

  // User Posts State
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userPostsLoading, setUserPostsLoading] = useState(true);
  
  // Community Posts State
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityResponse | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPostResponse[]>([]);
  const [communityPostsLoading, setCommunityPostsLoading] = useState(false);

  // General Loading & Refreshing
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [postToDelete, setPostToDelete] = useState<{ id: number; type: 'user' | 'community' } | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Fetch User Feed Posts
  const fetchUserPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setUserPostsLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/posts/all');
      setUserPosts(response.data || []);
    } catch (err: any) {
      console.error('Error fetching user posts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load posts');
    } finally {
      setUserPostsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Fetch Public Communities
  const fetchCommunities = useCallback(async () => {
    try {
      const data = await communityService.getPublicCommunities();
      setCommunities(data || []);
      if (data && data.length > 0 && !selectedCommunity) {
        setSelectedCommunity(data[0]);
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
    }
  }, [selectedCommunity]);

  // 3. Fetch Community Posts
  const fetchCommunityPosts = useCallback(async (communityId: number, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setCommunityPostsLoading(true);
    setError(null);

    try {
      const data = await communityService.getCommunityPosts(communityId);
      setCommunityPosts(data || []);
    } catch (err: any) {
      console.error('Error fetching community posts:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load community posts');
    } finally {
      setCommunityPostsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'user') {
      fetchUserPosts();
    } else {
      fetchCommunities();
    }
  }, [activeTab, fetchUserPosts, fetchCommunities]);

  useEffect(() => {
    if (activeTab === 'community' && selectedCommunity) {
      fetchCommunityPosts(selectedCommunity.id);
    }
  }, [selectedCommunity, activeTab, fetchCommunityPosts]);

  const onRefresh = () => {
    if (activeTab === 'user') {
      fetchUserPosts(true);
    } else if (selectedCommunity) {
      fetchCommunityPosts(selectedCommunity.id, true);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    setActionLoading(true);
    try {
      if (postToDelete.type === 'user') {
        await adminService.forceDeletePost(postToDelete.id);
        setUserPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      } else {
        await adminService.deleteCommunityPost(postToDelete.id);
        setCommunityPosts(prev => prev.filter(p => p.id !== postToDelete.id));
      }
      Alert.alert('Success', 'Post deleted successfully');
      setConfirmDeleteVisible(false);
      setPostToDelete(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  const renderMediaPreview = (mediaUrls: string[] | string | undefined) => {
    if (!mediaUrls) return null;
    
    let urls: string[] = [];
    if (Array.isArray(mediaUrls)) {
      urls = mediaUrls;
    } else if (typeof mediaUrls === 'string' && mediaUrls.length > 0) {
      urls = mediaUrls.split('|||MEDIA_SEPARATOR|||');
    }

    if (urls.length === 0) return null;

    return (
      <View style={styles.mediaContainer}>
        <Image source={{ uri: urls[0] }} style={styles.mediaImage} />
        {urls.length > 1 && (
          <View style={[styles.mediaCountBadge, { backgroundColor: colors.overlay }]}>
            <Text style={{ color: colors.textInverse, fontSize: 12, fontWeight: 'bold' }}>
              +{urls.length - 1}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title="Post Management" subtitle="Review and moderate user generated content" />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'user' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveTab('user')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'user' ? colors.accent : colors.textSecondary }]}>
            User Feed Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'community' ? colors.accent : colors.textSecondary }]}>
            Community Posts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Community Selector for Community Posts Tab */}
      {activeTab === 'community' && communities.length > 0 && (
        <View style={styles.selectorWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
            {communities.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.communityChip,
                  { 
                    backgroundColor: selectedCommunity?.id === c.id ? colors.accentLight : colors.surface, 
                    borderColor: colors.surfaceBorder 
                  }
                ]}
                onPress={() => setSelectedCommunity(c)}
              >
                <Text style={[styles.communityChipText, { color: selectedCommunity?.id === c.id ? colors.accent : colors.textSecondary }]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Lists */}
      {activeTab === 'user' ? (
        userPostsLoading ? (
          <View style={styles.listContainer}>
            <LoadingSkeleton type="card" count={3} />
          </View>
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Feed Posts"
            description={error}
            actionLabel="Try Again"
            onAction={() => fetchUserPosts()}
          />
        ) : userPosts.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No Feed Posts"
            description="There are currently no user feed posts."
            actionLabel="Refresh"
            onAction={() => fetchUserPosts()}
          />
        ) : (
          <FlatList
            data={userPosts}
            keyExtractor={(item) => `user-post-${item.id}`}
            renderItem={({ item }) => (
              <View style={[styles.postCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.postHeader}>
                  {item.userProfilePicture ? (
                    <Image source={{ uri: item.userProfilePicture }} style={styles.postAvatar} />
                  ) : (
                    <View style={[styles.postAvatarPlaceholder, { backgroundColor: colors.background }]}>
                      <Ionicons name="person" size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.postHeaderInfo}>
                    <Text style={[styles.postAuthor, { color: colors.textPrimary }]}>{item.username}</Text>
                    {item.userProfession ? (
                      <Text style={[styles.postProfession, { color: colors.textSecondary }]}>{item.userProfession}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: 'rgba(229, 83, 75, 0.1)' }]}
                    onPress={() => {
                      setPostToDelete({ id: item.id, type: 'user' });
                      setConfirmDeleteVisible(true);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.postContent, { color: colors.textPrimary }]}>{item.content}</Text>

                {renderMediaPreview(item.mediaUrls)}

                <View style={[styles.postFooter, { borderTopColor: colors.surfaceBorder }]}>
                  <View style={styles.postStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.statValue, { color: colors.textSecondary }]}>{item.likeCount || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.statValue, { color: colors.textSecondary }]}>{item.commentCount || 0}</Text>
                    </View>
                  </View>
                  <Text style={[styles.postDate, { color: colors.textTertiary }]}>
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )
      ) : (
        // Community Posts Tab
        communityPostsLoading ? (
          <View style={styles.listContainer}>
            <LoadingSkeleton type="card" count={3} />
          </View>
        ) : error ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Error Loading Community Posts"
            description={error}
            actionLabel="Try Again"
            onAction={() => selectedCommunity && fetchCommunityPosts(selectedCommunity.id)}
          />
        ) : !selectedCommunity ? (
          <EmptyState
            icon="people-outline"
            title="No Communities"
            description="Create a community first to review its posts."
          />
        ) : communityPosts.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No Community Posts"
            description={`There are currently no approved posts in "${selectedCommunity.name}".`}
            actionLabel="Refresh"
            onAction={() => fetchCommunityPosts(selectedCommunity.id)}
          />
        ) : (
          <FlatList
            data={communityPosts}
            keyExtractor={(item) => `comm-post-${item.id}`}
            renderItem={({ item }) => (
              <View style={[styles.postCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.postHeader}>
                  {item.userProfilePicture ? (
                    <Image source={{ uri: item.userProfilePicture }} style={styles.postAvatar} />
                  ) : (
                    <View style={[styles.postAvatarPlaceholder, { backgroundColor: colors.background }]}>
                      <Ionicons name="person" size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.postHeaderInfo}>
                    <Text style={[styles.postAuthor, { color: colors.textPrimary }]}>{item.username}</Text>
                    <Text style={[styles.postCommunityTag, { color: colors.accent }]}>in {item.communityName}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: 'rgba(229, 83, 75, 0.1)' }]}
                    onPress={() => {
                      setPostToDelete({ id: item.id, type: 'community' });
                      setConfirmDeleteVisible(true);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.postContent, { color: colors.textPrimary }]}>{item.content}</Text>

                {renderMediaPreview(item.mediaUrls)}

                <View style={[styles.postFooter, { borderTopColor: colors.surfaceBorder }]}>
                  <Text style={[styles.postDate, { color: colors.textTertiary }]}>
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        confirmColor={colors.danger}
        onConfirm={handleDeletePost}
        onCancel={() => setConfirmDeleteVisible(false)}
        loading={actionLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1.5,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectorWrapper: {
    paddingVertical: 12,
  },
  selectorScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  communityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  communityChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  postCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  postProfession: {
    fontSize: 11,
    marginTop: 1,
  },
  postCommunityTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaCountBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 11,
  },
});
