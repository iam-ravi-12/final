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
import ImageCarousel from '../components/ImageCarousel';

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const postDate = new Date(dateString);
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
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => router.push(`/post/${item.id}`)}
        activeOpacity={0.7}
      >
        <Text style={styles.postContent} numberOfLines={3} ellipsizeMode="tail">
          {item.content}
        </Text>
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <ImageCarousel images={item.mediaUrls} height={200} borderRadius={8} />
        )}
        <View style={styles.postActions}>
          <View style={styles.actionItem}>
            <Ionicons name="heart-outline" size={16} color="#666" />
            <Text style={styles.actionText}>{item.likeCount}</Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.actionText}>{item.commentCount}</Text>
          </View>
          <Text style={styles.postTimestamp}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  const displayedPosts = useMemo(() => {
    return showAllPosts ? userPosts : userPosts.slice(0, 3);
  }, [userPosts, showAllPosts]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          {profileData?.profilePicture ? (
            <Image
              source={{ uri: profileData.profilePicture }}
              style={styles.avatarLarge}
            />
          ) : (
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {profileData?.name?.charAt(0).toUpperCase() || 
                 profileData?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.name}>
            {profileData?.name || profileData?.username}
          </Text>
          <Text style={styles.username}>@{profileData?.username}</Text>
          <Text style={styles.email}>{profileData?.email}</Text>

          {/* Follow Button - only show if not viewing own profile */}
          {currentUser?.id !== userId && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  followStats?.isFollowing && styles.followingButton,
                ]}
                onPress={handleFollowAction}
                disabled={loadingAction || followStats?.followStatus === 'PENDING'}
              >
                {loadingAction ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      followStats?.isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {getFollowButtonText()}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.messageButton}
                onPress={handleMessage}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Followers/Following Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followStats?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followStats?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="briefcase" size={24} color="#007AFF" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Profession</Text>
              <Text style={styles.infoValue}>
                {profileData?.profession || 'Not set'}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="business" size={24} color="#007AFF" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Organization</Text>
              <Text style={styles.infoValue}>
                {profileData?.organization || 'Not set'}
              </Text>
            </View>
          </View>

          {profileData?.location && (
            <View style={styles.infoCard}>
              <Ionicons name="location" size={24} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {profileData.location}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Text style={styles.postsSectionTitle}>
              Posts ({userPosts.length})
            </Text>
            {userPosts.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowAllPosts(!showAllPosts)}
              >
                <Text style={styles.viewAllButton}>
                  {showAllPosts ? 'Show Less' : 'View All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {userPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyPostsText}>No posts yet</Text>
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
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
    flex: 1,
  },
  followingButton: {
    backgroundColor: '#e0e0e0',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#333',
  },
  messageButton: {
    backgroundColor: '#007AFF',
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
    color: '#fff',
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
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  infoSection: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
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
    color: '#333',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
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
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
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
    color: '#666',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
});
