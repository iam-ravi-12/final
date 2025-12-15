import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import postService, { PostResponse } from '../services/postService';
import SosButton from '../components/SosButton';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

type PostSection = 'all' | 'professional' | 'help';

export default function HomeScreen() {
  const [activeSection, setActiveSection] = useState<PostSection>('all');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [showSosModal, setShowSosModal] = useState(false);
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
    // Navigate to edit post screen (you can implement this later)
    Alert.alert('Edit Post', 'Edit functionality will be implemented');
  };

  const getUserInitial = () => {
    return (user?.name?.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase();
  };

  const getPostCardStyle = (item: PostResponse): StyleProp<ViewStyle> => {
    if (item.isHelpSection) {
      return item.isSolved 
        ? [styles.postCard, styles.postCardSolved]
        : [styles.postCard, styles.postCardHelp];
    }
    return styles.postCard;
  };

  const shouldShowMarkSolvedButton = (item: PostResponse): boolean => {
    const result = item.isHelpSection === true && item.isSolved !== true && user?.userId === item.userId;
    // Debug: Log button visibility conditions
    if (item.isHelpSection) {
      console.log('Help post debug:', {
        postId: item.id,
        isHelpSection: item.isHelpSection,
        isSolved: item.isSolved,
        currentUserId: user?.userId,
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
          {item.userProfilePicture ? (
            <Image
              source={{ uri: item.userProfilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfoText}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.profession}>{item.userProfession}</Text>
          </View>
        </View>
        
        <View style={styles.postHeaderRight}>
          <Text style={styles.timestamp}>{formatTimeAgo(item.createdAt)}</Text>
          {user?.userId === item.userId && (
            <TouchableOpacity
              onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}
              style={styles.menuButton}
              activeOpacity={0.6}
            >
              <View style={styles.dotsContainer}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {item.isHelpSection && (
          <View style={styles.helpBadge}>
            <Text style={styles.helpBadgeText}>
              {item.isSolved ? 'Solved' : 'Help'}
            </Text>
          </View>
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
            style={styles.menuOverlay}
            onPress={() => setMenuVisible(null)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleEditPost(item.id)}
              >
                <Ionicons name="create-outline" size={20} color="#007AFF" />
                <Text style={styles.menuItemText}>Edit Post</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleDeletePost(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>
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
        <Text style={styles.postContent} numberOfLines={3} ellipsizeMode="tail">
          {item.content}
        </Text>
        
        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <Image
            source={{ uri: item.mediaUrls[0] }}
            style={styles.postImage}
            resizeMode="cover"
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
            color={item.isLiked ? '#FF3B30' : '#666'}
          />
          <Text style={styles.actionText}>{item.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/post/${item.id}`)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{item.commentCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Mark as Solved button for help posts */}
      {shouldShowMarkSolvedButton(item) && (
        <TouchableOpacity
          style={styles.markSolvedButton}
          onPress={() => handleMarkAsSolved(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.markSolvedButtonText}>Mark as Solved</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {getUserInitial()}
              </Text>
            </View>
          )}
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name || user?.username || 'User'}
            </Text>
            <Text style={styles.profileProfession} numberOfLines={1}>
              {user?.profession || 'Professional'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push('/(tabs)/leaderboard')}
            activeOpacity={0.6}
          >
            <Ionicons name="trophy" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerActionButton}
            activeOpacity={0.6}
            disabled
          >
            <Ionicons name="search" size={24} color="#999" />
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

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'all' && styles.activeTab]}
          onPress={() => setActiveSection('all')}
        >
          <Text
            style={[
              styles.tabText,
              activeSection === 'all' && styles.activeTabText,
            ]}
          >
            All Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeSection === 'professional' && styles.activeTab,
          ]}
          onPress={() => setActiveSection('professional')}
        >
          <Text
            style={[
              styles.tabText,
              activeSection === 'professional' && styles.activeTabText,
            ]}
          >
            Professional
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeSection === 'help' && styles.activeTab]}
          onPress={() => setActiveSection('help')}
        >
          <Text
            style={[
              styles.tabText,
              activeSection === 'help' && styles.activeTabText,
            ]}
          >
            Help
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-post')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 16,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#fff',
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
    color: '#333',
  },
  profileProfession: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  sosCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#FF0000',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
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
  postCardHelp: {
    backgroundColor: '#ffe6e6', // Light red for help posts
  },
  postCardSolved: {
    backgroundColor: '#e6ffe6', // Light green for solved posts
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
    color: '#999',
    marginBottom: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  profession: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  helpBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  helpBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  markSolvedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  markSolvedButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 15,
    color: '#333',
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
    color: '#666',
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
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 200,
    shadowColor: '#000',
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
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});
