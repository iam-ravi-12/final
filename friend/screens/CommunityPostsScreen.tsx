import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share as RNShare,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import communityService, { CommunityPostResponse, CommunityResponse } from '../services/communityService';
import { APP_URL, MAX_POST_LENGTH } from '../constants/config';
import { copyToClipboard, formatRelativeDate, formatMemberCount } from '../utils/helpers';

type TabType = 'approved' | 'pending';

export default function CommunityPostsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const communityId = parseInt(params.communityId as string);
  const communityName = params.communityName as string;

  const [community, setCommunity] = useState<CommunityResponse | null>(null);
  const [approvedPosts, setApprovedPosts] = useState<CommunityPostResponse[]>([]);
  const [pendingPosts, setPendingPosts] = useState<CommunityPostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('approved');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      const [communityData, postsData] = await Promise.all([
        communityService.getCommunityById(communityId),
        communityService.getCommunityPosts(communityId),
      ]);
      
      setCommunity(communityData);
      setApprovedPosts(postsData);

      // Load pending posts if user is admin
      if (communityData.isAdmin) {
        const pending = await communityService.getPendingPosts(communityId);
        setPendingPosts(pending);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunityData();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert('Error', 'Please enter post content');
      return;
    }

    try {
      setSubmitting(true);
      await communityService.createCommunityPost(communityId, {
        content: postContent.trim(),
        mediaUrls: [],
      });
      // More generic success message since all posts go through approval
      Alert.alert('Success', 'Post created successfully!');
      setPostContent('');
      setShowCreatePost(false);
      await loadCommunityData();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovePost = async (postId: number) => {
    try {
      await communityService.approvePost(postId);
      Alert.alert('Success', 'Post approved successfully');
      await loadCommunityData();
    } catch (error) {
      console.error('Error approving post:', error);
      Alert.alert('Error', 'Failed to approve post');
    }
  };

  const handleRejectPost = async (postId: number) => {
    Alert.alert(
      'Reject Post',
      'Are you sure you want to reject this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.rejectPost(postId);
              Alert.alert('Success', 'Post rejected successfully');
              await loadCommunityData();
            } catch (error) {
              console.error('Error rejecting post:', error);
              Alert.alert('Error', 'Failed to reject post');
            }
          },
        },
      ]
    );
  };

  const handleLeaveCommunity = async () => {
    Alert.alert(
      'Leave Community',
      'Are you sure you want to leave this community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.leaveCommunity(communityId);
              Alert.alert('Success', 'Left community successfully');
              router.back();
            } catch (error) {
              console.error('Error leaving community:', error);
              Alert.alert('Error', 'Failed to leave community');
            }
          },
        },
      ]
    );
  };

  const handleShareCommunity = async () => {
    try {
      const shareUrl = `${APP_URL}/community/${communityId}`;
      const message = `Join ${community?.name} on our social network!\n\n${community?.description}\n\n${shareUrl}`;
      
      if (Platform.OS === 'web') {
        // Web fallback with proper error handling
        try {
          await copyToClipboard(shareUrl);
          Alert.alert('Link Copied', 'Community link copied to clipboard!');
        } catch (err) {
          Alert.alert('Error', 'Failed to copy link to clipboard');
        }
      } else {
        await RNShare.share({
          title: `Join ${community?.name}`,
          message,
          url: shareUrl,
        });
      }
    } catch (error) {
      console.error('Error sharing community:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return formatRelativeDate(dateString);
  };

  const renderPost = ({ item, isPending = false }: { item: CommunityPostResponse; isPending?: boolean }) => {
    const initial = item.username.charAt(0).toUpperCase();

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          {item.userProfilePicture ? (
            <Image source={{ uri: item.userProfilePicture }} style={styles.profilePic} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.postHeaderInfo}>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.postDate}>{formatDate(item.createdAt)}</Text>
          </View>
          {isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <View style={styles.mediaContainer}>
            {item.mediaUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {isPending && community?.isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprovePost(item.id)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectPost(item.id)}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Community not found</Text>
      </View>
    );
  }

  const currentPosts = activeTab === 'approved' ? approvedPosts : pendingPosts;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{community.name}</Text>
        <TouchableOpacity onPress={handleShareCommunity} style={styles.shareIconButton}>
          <Ionicons name="share-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Community Details Banner */}
      <View style={styles.communityBanner}>
        {community.profilePicture ? (
          <Image source={{ uri: community.profilePicture }} style={styles.communityPic} />
        ) : (
          <View style={styles.communityAvatar}>
            <Text style={styles.communityAvatarText}>
              {community.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.communityDetails}>
          <Text style={styles.communityDescription} numberOfLines={2}>
            {community.description}
          </Text>
          <View style={styles.communityMeta}>
            <Text style={styles.metaText}>
              👤 {formatMemberCount(community.memberCount)}
            </Text>
            {community.isPrivate && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={12} color="#666" />
                <Text style={styles.privateBadgeText}>Private</Text>
              </View>
            )}
            {community.isAdmin && (
              <View style={styles.adminBadgeSmall}>
                <Text style={styles.adminBadgeSmallText}>👑 Admin</Text>
              </View>
            )}
          </View>
        </View>
        {!community.isAdmin && (
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCommunity}>
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Tabs */}
      {community.isAdmin && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
            onPress={() => setActiveTab('approved')}
          >
            <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
              Approved Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending ({pendingPosts.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Post Button */}
      <View style={styles.createPostSection}>
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.createPostButtonText}>Create Post</Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={currentPosts}
        renderItem={({ item }) => renderPost({ item, isPending: activeTab === 'pending' })}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'approved' ? 'No posts yet' : 'No pending posts'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'approved' && 'Be the first to post in this community!'}
            </Text>
          </View>
        }
      />

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Post</Text>
                <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={styles.postInput}
                  value={postContent}
                  onChangeText={setPostContent}
                  placeholder="What's on your mind?"
                  multiline
                  numberOfLines={6}
                  maxLength={MAX_POST_LENGTH}
                  textAlignVertical="top"
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreatePost(false);
                    setPostContent('');
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, submitting && styles.disabledButton]}
                  onPress={handleCreatePost}
                  disabled={submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginLeft: -28,
  },
  shareIconButton: {
    padding: 4,
  },
  communityBanner: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityPic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  communityAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  communityDetails: {
    flex: 1,
    marginLeft: 12,
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  privateBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  adminBadgeSmall: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adminBadgeSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  leaveButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  leaveButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  createPostSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  createPostButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  mediaContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
  },
  adminActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  postInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
