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
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import postService, { PostResponse } from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

type PostSection = 'all' | 'professional' | 'help';

export default function HomeScreen() {
  const [activeSection, setActiveSection] = useState<PostSection>('all');
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      await postService.toggleLike(postId);
      loadPosts(); // Reload to get updated like status
    } catch (error) {
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const renderPost = ({ item }: { item: PostResponse }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.profession}>{item.userProfession}</Text>
          </View>
        </View>
        {item.isHelpSection && (
          <View style={styles.helpBadge}>
            <Text style={styles.helpBadgeText}>Help</Text>
          </View>
        )}
      </View>

      <Text style={styles.postContent}>{item.content}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <IconSymbol
            name={item.isLiked ? 'heart.fill' : 'heart'}
            size={20}
            color={item.isLiked ? '#FF3B30' : '#666'}
          />
          <Text style={styles.actionText}>{item.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/post/${item.id}`)}
        >
          <IconSymbol name="bubble.left" size={20} color="#666" />
          <Text style={styles.actionText}>{item.commentCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Professional Network</Text>
        <TouchableOpacity onPress={() => router.push('/create-post')}>
          <IconSymbol name="plus.circle.fill" size={28} color="#007AFF" />
        </TouchableOpacity>
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
    </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
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
});
