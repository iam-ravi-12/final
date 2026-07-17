import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import authService, { ProfileResponse } from '../services/authService';
import followService, { FollowStatsResponse } from '../services/followService';
import postService, { PostResponse } from '../services/postService';
import { parseUTCDate } from '../utils/helpers';
import PostMediaAttachment from '../components/PostMediaAttachment';
import { inferMediaType } from '../utils/media';
import { useAppTheme } from '../constants/AppTheme';
import ReportModal from '../components/ReportModal';
import reportService from '../services/reportService';

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const postDate = parseUTCDate(dateString);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return postDate.toLocaleDateString();
};

export default function UserProfileScreen() {
  const { userId: userIdParam } = useLocalSearchParams();
  const userId = Array.isArray(userIdParam) 
    ? parseInt(userIdParam[0], 10) 
    : typeof userIdParam === 'string' 
    ? parseInt(userIdParam, 10) 
    : undefined;
  
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [followStats, setFollowStats] = useState<FollowStatsResponse | null>(null);
  const [userPosts, setUserPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { colors, isDark } = useAppTheme();

  const loadUserData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [profile, stats, posts] = await Promise.all([
        authService.getUserProfile(userId),
        followService.getFollowStats(userId),
        postService.getUserPosts(userId),
      ]);
      setProfileData(profile);
      setFollowStats(stats);
      setUserPosts(posts);
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId, loadUserData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
  }, [loadUserData]);

  const handleFollowAction = useCallback(async () => {
    if (!userId || loadingAction) return;

    try {
      setLoadingAction(true);
      if (followStats?.isFollowing) {
        await followService.unfollow(userId);
        Alert.alert('Success', 'Unfollowed successfully');
      } else {
        await followService.sendFollowRequest(userId);
        Alert.alert('Success', 'Follow request sent');
      }
      // Reload stats
      const stats = await followService.getFollowStats(userId);
      setFollowStats(stats);
    } catch (error) {
      console.error('Follow action failed:', error);
      Alert.alert('Error', 'Failed to perform action');
    } finally {
      setLoadingAction(false);
    }
  }, [userId, loadingAction, followStats?.isFollowing]);

  const getFollowButtonText = useCallback(() => {
    if (!followStats) return 'Follow';
    if (followStats.isFollowing) return 'Unfollow';
    if (followStats.followStatus === 'PENDING') return 'Requested';
    return 'Follow';
  }, [followStats]);

  const handleMessage = useCallback(() => {
    if (!userId) return;
    router.push(`/chat/${userId}`);
  }, [userId]);

  const renderPost = useCallback(({ item }: { item: PostResponse }) => {
    const mediaStyle =
      item.mediaUrls && item.mediaUrls.length > 0 && inferMediaType(item.mediaUrls[0]) === 'audio'
        ? styles.postAudio
        : styles.postImage;
    return (
      <TouchableOpacity
        style={[styles.postCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        onPress={() => router.push(`/post/${item.id}`)}
        activeOpacity={0.7}
      >
        <Text style={[styles.postContent, { color: colors.textPrimary }]} numberOfLines={3} ellipsizeMode="tail">
          {item.content}
        </Text>
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <PostMediaAttachment uri={item.mediaUrls[0]} mediaStyle={mediaStyle} />
        )}
        <View style={styles.postActions}>
          <View style={styles.actionItem}>
            <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.likeCount}</Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.commentCount}</Text>
          </View>
          <Text style={[styles.postTimestamp, { color: colors.textTertiary }]}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors]);

  const displayedPosts = useMemo(() => {
    return showAllPosts ? userPosts : userPosts.slice(0, 3);
  }, [userPosts, showAllPosts]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          {profileData?.profilePicture ? (
            <Image
              source={{ uri: profileData.profilePicture }}
              style={styles.avatarLarge}
            />
          ) : (
            <View style={[styles.avatarLarge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.avatarTextLarge, { color: colors.textInverse }]}>
                {profileData?.name?.charAt(0).toUpperCase() || 
                 profileData?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {profileData?.name || profileData?.username}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{profileData?.username}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{profileData?.email}</Text>

          {/* Follow Button - only show if not viewing own profile */}
          {currentUser?.id !== userId && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  { backgroundColor: colors.accent },
                  followStats?.isFollowing && { backgroundColor: colors.surfaceBorder },
                ]}
                onPress={handleFollowAction}
                disabled={loadingAction || followStats?.followStatus === 'PENDING'}
              >
                {loadingAction ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: colors.textInverse },
                      followStats?.isFollowing && { color: colors.textPrimary },
                    ]}
                  >
                    {getFollowButtonText()}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: colors.accent }]}
                onPress={handleMessage}
              >
                <Ionicons name="chatbubble-outline" size={20} color={colors.textInverse} />
                <Text style={[styles.messageButtonText, { color: colors.textInverse }]}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: colors.danger }]}
                onPress={() => setShowReportModal(true)}
              >
                <Ionicons name="flag-outline" size={20} color={colors.textInverse} />
                <Text style={[styles.messageButtonText, { color: colors.textInverse }]}>Report</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Followers/Following Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{followStats?.followersCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{followStats?.followingCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="briefcase" size={24} color={colors.accent} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Profession</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {profileData?.profession || 'Not set'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="business" size={24} color={colors.accent} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Organization</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {profileData?.organization || 'Not set'}
              </Text>
            </View>
          </View>

          {profileData?.location && (
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="location" size={24} color={colors.accent} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {profileData.location}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={[styles.postsSectionTitle, { color: colors.textPrimary }]}>
              Posts ({userPosts.length})
            </Text>
            {userPosts.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowAllPosts(!showAllPosts)}
              >
                <Text style={[styles.viewAllButton, { color: colors.accent }]}>
                  {showAllPosts ? 'Show Less' : 'View All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {userPosts.length === 0 ? (
            <View style={[styles.emptyPosts, { backgroundColor: colors.surface }]}>
              <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyPostsText, { color: colors.textTertiary }]}>No posts yet</Text>
            </View>
          ) : (
            <View>
              {displayedPosts.map((post) => (
                <View key={post.id}>
                  {renderPost({ item: post })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Report User Modal */}
      {userId && (
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={(reason) => reportService.reportUser(userId, reason)}
          entityType="user"
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  followButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
    flex: 1,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  infoSection: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  postsSection: {
    padding: 16,
    paddingTop: 8,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
  },
  emptyPostsText: {
    fontSize: 16,
    marginTop: 12,
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
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postAudio: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
  },
  postTimestamp: {
    fontSize: 12,
    marginLeft: 'auto',
  },
});
