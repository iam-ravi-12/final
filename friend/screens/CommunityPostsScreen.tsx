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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import communityService, { CommunityPostResponse, CommunityResponse, CommunityMemberResponse } from '../services/communityService';
import { APP_URL, MAX_POST_LENGTH } from '../constants/config';
import { copyToClipboard, formatRelativeDate, formatMemberCount } from '../utils/helpers';
import PostMediaAttachment from '../components/PostMediaAttachment';
import { inferMediaType } from '../utils/media';
import { useAppTheme } from '../constants/AppTheme';

type TabType = 'approved' | 'pending' | 'members';

export default function CommunityPostsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams();
  const communityId = parseInt(params.communityId as string);
  const communityName = params.communityName as string;

  const [community, setCommunity] = useState<CommunityResponse | null>(null);
  const [approvedPosts, setApprovedPosts] = useState<CommunityPostResponse[]>([]);
  const [pendingPosts, setPendingPosts] = useState<CommunityPostResponse[]>([]);
  const [members, setMembers] = useState<CommunityMemberResponse[]>([]);
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
      const communityData = await communityService.getCommunityById(communityId);
      
      setCommunity(communityData);

      // Only load posts if user is a member
      if (communityData.isMember) {
        const postsData = await communityService.getCommunityPosts(communityId);
        setApprovedPosts(postsData);

        // Load pending posts if user is admin
        if (communityData.isAdmin) {
          const pending = await communityService.getPendingPosts(communityId);
          setPendingPosts(pending);
          // Load members list
          const membersData = await communityService.getCommunityMembers(communityId);
          setMembers(membersData);
        }
      } else {
        // Clear posts if not a member
        setApprovedPosts([]);
        setPendingPosts([]);
        setMembers([]);
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
      // Inform user about approval process
      Alert.alert(
        'Success', 
        'Post submitted successfully! It will appear once approved by the admin.'
      );
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

  const handleJoinCommunity = async () => {
    try {
      await communityService.joinCommunity(communityId);
      Alert.alert('Success', 'Joined community successfully!');
      await loadCommunityData();
    } catch (error) {
      console.error('Error joining community:', error);
      Alert.alert('Error', 'Failed to join community');
    }
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

  const handleRemoveMember = async (userId: number, username: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${username} from this community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await communityService.removeMember(communityId, userId);
              
              // Reload all community data to ensure everything is in sync
              await loadCommunityData();
              
              Alert.alert('Success', `${username} has been removed from the community`);
            } catch (error: any) {
              console.error('Error removing member:', error);
              
              // Extract error message properly
              let errorMessage = 'Failed to remove member';
              if (error.response?.data) {
                // If data is a string, use it directly; if it's an object, stringify it
                if (typeof error.response.data === 'string') {
                  errorMessage = error.response.data;
                } else if (error.response.data.message) {
                  errorMessage = error.response.data.message;
                } else {
                  errorMessage = 'Failed to remove member. Please try again.';
                }
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return formatRelativeDate(dateString);
  };

  const renderPost = ({ item, isPending = false }: { item: CommunityPostResponse; isPending?: boolean }) => {
    const initial = item.username.charAt(0).toUpperCase();

    return (
      <View style={[styles.postCard, { backgroundColor: colors.cardGlassBg, borderColor: colors.cardGlassBorder, borderWidth: 1, shadowColor: isDark ? 'rgba(56, 189, 248, 0.06)' : colors.shadow }]}>
        <View style={styles.postHeader}>
          <TouchableOpacity
            onPress={() => router.push(`/user/${item.userId}`)}
            activeOpacity={0.7}
          >
            {item.userProfilePicture ? (
              <Image source={{ uri: item.userProfilePicture }} style={styles.profilePic} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={[styles.avatarText, { color: colors.textInverse }]}>{initial}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.postHeaderInfo}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>@{item.username}</Text>
            <Text style={[styles.postDate, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
          </View>
          {isPending && (
            <View style={[styles.pendingBadge, { backgroundColor: colors.warning }]}>
              <Text style={[styles.pendingText, { color: colors.textInverse }]}>Pending</Text>
            </View>
          )}
        </View>

        <Text style={[styles.postContent, { color: colors.textPrimary }]}>{item.content}</Text>

        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <View style={styles.mediaContainer}>
            {item.mediaUrls.map((url, index) => (
              <PostMediaAttachment
                key={index}
                uri={url}
                mediaStyle={inferMediaType(url) === 'audio' ? styles.mediaAudio : styles.mediaImage}
              />
            ))}
          </View>
        )}

        {isPending && community?.isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={[styles.approveButton, { backgroundColor: colors.success }]}
              onPress={() => handleApprovePost(item.id)}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
              <Text style={[styles.approveButtonText, { color: colors.textInverse }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectButton, { backgroundColor: colors.danger }]}
              onPress={() => handleRejectPost(item.id)}
            >
              <Ionicons name="close-circle" size={20} color={colors.textInverse} />
              <Text style={[styles.rejectButtonText, { color: colors.textInverse }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderMember = ({ item }: { item: CommunityMemberResponse }) => {
    return (
      <View style={[styles.memberCard, { backgroundColor: colors.cardGlassBg, borderColor: colors.cardGlassBorder, borderWidth: 1, shadowColor: isDark ? 'rgba(56, 189, 248, 0.06)' : colors.shadow }]}>
        <TouchableOpacity
          style={styles.memberInfo}
          onPress={() => router.push(`/user/${item.userId}`)}
          activeOpacity={0.7}
        >
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={[styles.memberAvatar, { backgroundColor: undefined }]} />
          ) : (
            <View style={[styles.memberAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.memberAvatarText, { color: colors.textInverse }]}>
                {(item.name || item.username).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.memberDetails}>
            <View style={styles.memberNameContainer}>
              <Text style={[styles.memberName, { color: colors.textPrimary }]}>{item.name || item.username}</Text>
              {item.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={[styles.adminBadgeText, { color: colors.textPrimary }]}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[styles.memberUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
            {item.profession && (
              <Text style={[styles.memberProfession, { color: colors.textTertiary }]}>{item.profession}</Text>
            )}
            <Text style={[styles.memberJoinDate, { color: colors.textTertiary }]}>
              Joined {formatRelativeDate(item.joinedAt)}
            </Text>
          </View>
        </TouchableOpacity>
        {!item.isAdmin && community?.isAdmin && (
          <TouchableOpacity
            style={styles.removeMemberButton}
            onPress={() => handleRemoveMember(item.userId, item.username)}
          >
            <Ionicons name="close-circle" size={24} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textTertiary }]}>Community not found</Text>
      </View>
    );
  }

  const currentPosts = activeTab === 'approved' ? approvedPosts : pendingPosts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Gradient Header Container */}
      <View style={{ backgroundColor: isDark ? 'rgba(8, 12, 22, 0.97)' : 'rgba(235, 244, 249, 0.92)' }}>
        {/* Community Details Banner & Inline Back Button */}
        <View style={styles.communityBanner}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tabs)/community');
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {community.profilePicture ? (
            <Image source={{ uri: community.profilePicture }} style={styles.communityPic} />
          ) : (
            <View style={[styles.communityAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.communityAvatarText, { color: colors.textInverse }]}>
                {community.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.communityDetails}>
            <Text style={[styles.communityName, { color: colors.textPrimary }]} numberOfLines={1}>
              {community.name}
            </Text>
            {community.description ? (
              <Text style={[styles.communityDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                {community.description}
              </Text>
            ) : null}
            <View style={styles.communityMeta}>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                👤 {formatMemberCount(community.memberCount)}
              </Text>
              {community.isPrivate && (
                <View style={[styles.privateBadge, { backgroundColor: colors.inputBg }]}>
                  <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
                  <Text style={[styles.privateBadgeText, { color: colors.textSecondary }]}>Private</Text>
                </View>
              )}
              {community.isAdmin && (
                <View style={styles.adminBadgeSmall}>
                  <Text style={[styles.adminBadgeSmallText, { color: colors.textPrimary }]}>👑 Admin</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity onPress={handleShareCommunity} style={styles.shareIconButton}>
            <Ionicons name="share-outline" size={22} color={colors.accent} />
          </TouchableOpacity>

          {!community.isAdmin && community.isMember && (
            <TouchableOpacity style={[styles.leaveButton, { backgroundColor: colors.surface, borderColor: colors.danger }]} onPress={handleLeaveCommunity}>
              <Text style={[styles.leaveButtonText, { color: colors.danger }]}>Leave</Text>
            </TouchableOpacity>
          )}
          {!community.isAdmin && !community.isMember && (
            <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.accent }]} onPress={handleJoinCommunity}>
              <Text style={[styles.joinButtonText, { color: colors.textInverse }]}>Join</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Admin Tabs */}
        {community.isAdmin && community.isMember && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'approved' && {
                  backgroundColor: isDark ? 'rgba(123, 189, 232, 0.18)' : 'rgba(10, 65, 116, 0.12)',
                },
              ]}
              onPress={() => setActiveTab('approved')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'approved' ? colors.accent : colors.textSecondary }, activeTab === 'approved' && { fontWeight: '700' }]}>
                Approved Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'pending' && {
                  backgroundColor: isDark ? 'rgba(123, 189, 232, 0.18)' : 'rgba(10, 65, 116, 0.12)',
                },
              ]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'pending' ? colors.accent : colors.textSecondary }, activeTab === 'pending' && { fontWeight: '700' }]}>
                Pending ({pendingPosts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'members' && {
                  backgroundColor: isDark ? 'rgba(123, 189, 232, 0.18)' : 'rgba(10, 65, 116, 0.12)',
                },
              ]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'members' ? colors.accent : colors.textSecondary }, activeTab === 'members' && { fontWeight: '700' }]}>
                Members ({members.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Show join prompt if not a member */}
      {!community.isMember ? (
        <View style={[styles.notMemberContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.notMemberTitle, { color: colors.textPrimary }]}>Join to See Posts</Text>
          <Text style={[styles.notMemberText, { color: colors.textSecondary }]}>
            You must be a member of this community to view and create posts.
          </Text>
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: colors.accent, shadowColor: colors.shadow }]}
            onPress={async () => {
              try {
                await communityService.joinCommunity(communityId);
                Alert.alert('Success', 'Joined community successfully!');
                await loadCommunityData();
              } catch (error) {
                console.error('Error joining community:', error);
                Alert.alert('Error', 'Failed to join community');
              }
            }}
          >
            <Text style={[styles.joinButtonText, { color: colors.textInverse }]}>Join Community</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Create Post Button - only show for posts tabs */}
          {activeTab !== 'members' && (
            <View style={[styles.createPostSection, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
              <TouchableOpacity
                style={[styles.createPostButton, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}
                onPress={() => setShowCreatePost(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                <Text style={[styles.createPostButtonText, { color: colors.accent }]}>Create Post</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content based on active tab */}
          {activeTab === 'members' ? (
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No members yet</Text>
                </View>
              }
            />
          ) : (
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
                  <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                    {activeTab === 'approved' ? 'No posts yet' : 'No pending posts'}
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                    {activeTab === 'approved' && 'Be the first to post in this community!'}
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}

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
          <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create Post</Text>
                <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <TextInput
                  style={[styles.postInput, { color: colors.inputText }]}
                  value={postContent}
                  onChangeText={setPostContent}
                  placeholder="What's on your mind?"
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  numberOfLines={6}
                  maxLength={MAX_POST_LENGTH}
                  textAlignVertical="top"
                />
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.surfaceBorder }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.inputBg }]}
                  onPress={() => {
                    setShowCreatePost(false);
                    setPostContent('');
                  }}
                  disabled={submitting}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.accent }, submitting && styles.disabledButton]}
                  onPress={handleCreatePost}
                  disabled={submitting}
                >
                  <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>
                    {submitting ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: -28,
  },
  shareIconButton: {
    padding: 4,
  },
  communityBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityPic: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  communityAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  communityDetails: {
    flex: 1,
    marginLeft: 12,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  communityDescription: {
    fontSize: 14,
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
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  privateBadgeText: {
    fontSize: 11,
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
  },
  leaveButton: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {},
  createPostSection: {
    padding: 12,
    borderBottomWidth: 1,
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  createPostButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
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
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 15,
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
  mediaAudio: {
    width: '100%',
    marginBottom: 8,
    borderRadius: 12,
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
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
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
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  postInput: {
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  notMemberContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notMemberTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  notMemberText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberDetails: {
    flex: 1,
  },
  memberNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  memberUsername: {
    fontSize: 14,
    marginBottom: 2,
  },
  memberProfession: {
    fontSize: 13,
    marginBottom: 2,
  },
  memberJoinDate: {
    fontSize: 12,
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  removeMemberButton: {
    padding: 8,
  },
});
