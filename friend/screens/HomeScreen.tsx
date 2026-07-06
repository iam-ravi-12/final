import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ViewStyle,
  StyleProp,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { parseUTCDate } from '@/utils/helpers';
import postService, { PostResponse } from '../services/postService';
import SosButton from '../components/SosButton';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import PostMediaAttachment from '../components/PostMediaAttachment';
import { inferMediaType } from '../utils/media';
import { useAppTheme } from '../constants/AppTheme';

type PostSection = 'all' | 'professional' | 'help';

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const [activeSection, setActiveSection] = useState<PostSection>('all');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, [activeSection]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      let data: PostResponse[] = [];
      
      switch (activeSection) {
        case 'all':
          data = await postService.getAllPosts();
          break;
        case 'professional':
          data = await postService.getProfessionalPosts();
          break;
        case 'help':
          data = await postService.getHelpPosts();
          break;
      }
      
      setPosts(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [activeSection]);

  const handleLike = async (postId: number) => {
    try {
      // Optimistically update UI
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
              }
            : post
        )
      );
      
      await postService.toggleLike(postId);
    } catch (error) {
      Alert.alert('Error', 'Failed to like post');
      // Revert on error
      loadPosts();
    }
  };

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

  const handleDeletePost = async (postId: number) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postService.deletePost(postId);
              setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              setMenuVisible(null);
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsSolved = async (postId: number) => {
    try {
      await postService.markAsSolved(postId);
      // Update the post in the local state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? { ...post, isSolved: true } : post
        )
      );
      Alert.alert('Success', 'Post marked as solved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark post as solved');
    }
  };

  const handleEditPost = (postId: number) => {
    setMenuVisible(null);
    router.push(`/edit-post/${postId}`);
  };

  const getUserInitial = () => {
    return (user?.name?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase();
  };

  const handleSearchToggle = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchQuery('');
    }
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(post =>
      post.content.toLowerCase().includes(query) ||
      post.username.toLowerCase().includes(query) ||
      post.userProfession?.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const getMediaStyle = (uri: string): StyleProp<ViewStyle> => {
    return inferMediaType(uri) === 'audio' ? styles.postAudio : styles.postImage;
  };

  const getPostCardStyle = (item: PostResponse): StyleProp<ViewStyle> => {
    const glassBg = isDark ? 'rgba(10, 37, 66, 0.68)' : 'rgba(255, 255, 255, 0.78)';
    const glassBorder = isDark ? 'rgba(123, 189, 232, 0.22)' : 'rgba(189, 216, 233, 0.6)';

    if (item.isHelpSection) {
      return item.isSolved 
        ? [styles.postCard, { backgroundColor: isDark ? 'rgba(20, 42, 25, 0.75)' : 'rgba(232, 248, 235, 0.85)', borderColor: isDark ? 'rgba(63, 185, 80, 0.35)' : 'rgba(63, 185, 80, 0.5)', borderWidth: 1 }]
        : [styles.postCard, { backgroundColor: isDark ? 'rgba(48, 22, 25, 0.75)' : 'rgba(253, 235, 236, 0.85)', borderColor: isDark ? 'rgba(229, 83, 75, 0.35)' : 'rgba(229, 83, 75, 0.5)', borderWidth: 1 }];
    }
    return [styles.postCard, { backgroundColor: glassBg, borderColor: glassBorder, borderWidth: 1, shadowColor: colors.shadow }];
  };

  const shouldShowMarkSolvedButton = (item: PostResponse): boolean => {
    const result = item.isHelpSection === true && item.isSolved !== true && user?.id === item.userId;
    // Debug: Log button visibility conditions
    if (item.isHelpSection) {
      console.log('Help post debug:', {
        postId: item.id,
        isHelpSection: item.isHelpSection,
        isSolved: item.isSolved,
        currentUserId: user?.id,
        postUserId: item.userId,
        shouldShow: result
      });
    }
    return result;
  };

  const renderPost = ({ item }: { item: PostResponse }): React.ReactElement => {
    return (
      <View style={getPostCardStyle(item)}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={() => router.push(`/user/${item.userId}`)}
            activeOpacity={0.7}
          >
            {item.userProfilePicture ? (
              <Image
                source={{ uri: item.userProfilePicture }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userInfoText}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{item.username}</Text>
            <Text style={[styles.profession, { color: colors.textSecondary }]}>{item.userProfession}</Text>
          </View>
        </View>
        
        <View style={styles.postHeaderRight}>
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>{formatTimeAgo(item.createdAt)}</Text>

            {item.isHelpSection && (
                <View style={[styles.helpBadge, { backgroundColor: colors.warning }]}>
                    <Text style={[styles.helpBadgeText, { color: colors.textInverse }]}>
                        {item.isSolved ? 'Solved' : 'Help'}
                    </Text>
                </View>
            )}
        </View>

          {user?.id === item.userId && (
              <TouchableOpacity
                  onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}
                  style={styles.menuButton}
                  activeOpacity={0.6}
              >
                  <View style={styles.dotsContainer}>
                      <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                      <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                      <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
                  </View>
              </TouchableOpacity>
          )}
      </View>

      {/* Menu Modal */}
      {menuVisible === item.id && (
        <Modal
          transparent
          visible={menuVisible === item.id}
          animationType="fade"
          onRequestClose={() => setMenuVisible(null)}
        >
          <Pressable
            style={[styles.menuOverlay, { backgroundColor: colors.overlay }]}
            onPress={() => setMenuVisible(null)}
          >
            <View style={[styles.menuContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleEditPost(item.id)}
              >
                <Ionicons name="create-outline" size={20} color={colors.accent} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit Post</Text>
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.surfaceBorder }]} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleDeletePost(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={[styles.menuItemText, { color: colors.danger }]}>
                  Delete Post
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      <TouchableOpacity
        onPress={() => router.push(`/post/${item.id}`)}
        activeOpacity={0.7}
      >
        <Text style={[styles.postContent, { color: colors.textPrimary }]} numberOfLines={3} ellipsizeMode="tail">
          {item.content}
        </Text>
        
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <PostMediaAttachment
            uri={item.mediaUrls[0]}
            mediaStyle={getMediaStyle(item.mediaUrls[0])}
          />
        )}
      </TouchableOpacity>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={item.isLiked ? colors.danger : colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/post/${item.id}`)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{item.commentCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Mark as Solved button for help posts */}
      {shouldShowMarkSolvedButton(item) && (
        <TouchableOpacity
          style={[styles.markSolvedButton, { backgroundColor: colors.success }]}
          onPress={() => handleMarkAsSolved(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
          <Text style={[styles.markSolvedButtonText, { color: colors.textInverse }]}>Mark as Solved</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topHeaderContainer, { backgroundColor: isDark ? 'rgba(0, 29, 57, 0.95)' : 'rgba(235, 244, 249, 0.92)' }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileInfo}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: colors.accent }]}>
                <Text style={[styles.headerAvatarText, { color: colors.textInverse }]}>
                  {getUserInitial()}
                </Text>
              </View>
            )}
            <View style={styles.profileTextContainer}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
                {user?.name || user?.username || 'User'}
              </Text>
              <Text style={[styles.profileProfession, { color: colors.textSecondary }]} numberOfLines={1}>
                {user?.profession || 'Add your profession'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionButton, { backgroundColor: colors.accentLight }]}
              onPress={() => router.push('/(tabs)/leaderboard')}
              activeOpacity={0.6}
            >
              <Ionicons name="trophy" size={22} color={colors.accent} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerActionButton, { backgroundColor: colors.accentLight }]}
              onPress={handleSearchToggle}
              activeOpacity={0.6}
            >
              <Ionicons name="search" size={22} color={colors.accent} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sosCircleButton}
              onPress={() => setShowSosModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.sosButtonText}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showSearchBar && (
          <View style={[styles.searchBarContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.inputText }]}
              placeholder="Search posts, users, professions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              placeholderTextColor={colors.inputPlaceholder}
            />
            <TouchableOpacity
              onPress={handleSearchToggle}
              style={styles.closeSearchButton}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeSection === 'all' && {
                backgroundColor: isDark ? 'rgba(123, 189, 232, 0.18)' : 'rgba(10, 65, 116, 0.12)',
              },
            ]}
            onPress={() => setActiveSection('all')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeSection === 'all' ? colors.accent : colors.textSecondary },
                activeSection === 'all' && { fontWeight: '700' },
              ]}
            >
              All Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeSection === 'professional' && {
                backgroundColor: isDark ? 'rgba(123, 189, 232, 0.18)' : 'rgba(10, 65, 116, 0.12)',
              },
            ]}
            onPress={() => setActiveSection('professional')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeSection === 'professional' ? colors.accent : colors.textSecondary },
                activeSection === 'professional' && { fontWeight: '700' },
              ]}
            >
              Professional
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeSection === 'help' && {
                backgroundColor: isDark ? 'rgba(123, 189, 232, 0.18)' : 'rgba(10, 65, 116, 0.12)',
              },
            ]}
            onPress={() => setActiveSection('help')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeSection === 'help' ? colors.accent : colors.textSecondary },
                activeSection === 'help' && { fontWeight: '700' },
              ]}
            >
              Help
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                {searchQuery ? 'No posts found' : 'No posts yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: 'rgba(0, 29, 57, 0.94)',
            borderColor: 'rgba(123, 189, 232, 0.35)',
            borderWidth: 1.5,
            shadowColor: '#000000',
          },
        ]}
        onPress={() => router.push('/create-post')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#7BBDE8" />
      </TouchableOpacity>

      {/* SOS Modal controlled by header button */}
      <SosButton 
        showModal={showSosModal}
        onClose={() => setShowSosModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderContainer: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileProfession: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5534B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#E5534B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabs: {
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
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  postCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfoText: {
    flex: 1,
  },
  postHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
      marginRight:4,
    marginBottom: 4,
  },
  menuButton: {
      // marginLeft:4,
      paddingLeft:12,
    // padding: 8,
    borderRadius: 16,
    // backgroundColor: '#000',
    minWidth: 10,
    minHeight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'column',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  profession: {
    fontSize: 12,
    marginTop: 2,
  },
  helpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  helpBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  markSolvedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  markSolvedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  postAudio: {
    width: '100%',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: 12,
    width: 200,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  closeSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
});
