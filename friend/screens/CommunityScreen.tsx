import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { followService } from '../services/followService';

interface User {
  id: number;
  username: string;
  name?: string;
  profession?: string;
  organization?: string;
  profilePicture?: string;
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  const fetchCommunityUsers = async () => {
    try {
      setLoading(true);
      // Fetch all users or suggested users from the backend
      // For now, we'll use the followers endpoint as a placeholder
      // In a real implementation, you'd have a dedicated endpoint for discovering users
      const response = await followService.getFollowers(user?.id || 0);
      
      // You might want to add a proper endpoint like:
      // const response = await api.get('/api/users/suggestions');
      // or
      // const response = await api.get('/api/users/all');
      
      setUsers(response || []);
    } catch (error) {
      console.error('Error fetching community users:', error);
      Alert.alert('Error', 'Failed to load community users');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingStatus = async () => {
    try {
      const following = await followService.getFollowing(user?.id || 0);
      const ids = new Set(following.map((f: any) => f.followingId));
      setFollowingIds(ids);
    } catch (error) {
      console.error('Error fetching following status:', error);
    }
  };

  useEffect(() => {
    fetchCommunityUsers();
    fetchFollowingStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCommunityUsers(), fetchFollowingStatus()]);
    setRefreshing(false);
  };

  const handleFollow = async (userId: number) => {
    try {
      await followService.followUser(userId);
      setFollowingIds(prev => new Set(prev).add(userId));
      Alert.alert('Success', 'You are now following this user');
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await followService.unfollowUser(userId);
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      Alert.alert('Success', 'You have unfollowed this user');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Alert.alert('Error', 'Failed to unfollow user');
    }
  };

  const renderUserCard = (userItem: User) => {
    const isFollowing = followingIds.has(userItem.id);
    const isCurrentUser = userItem.id === user?.id;

    return (
      <View key={userItem.id} style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {(userItem.name || userItem.username).charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userItem.name || userItem.username}</Text>
          <Text style={styles.userUsername}>@{userItem.username}</Text>
          {userItem.profession && (
            <Text style={styles.userProfession}>{userItem.profession}</Text>
          )}
          {userItem.organization && (
            <Text style={styles.userOrganization}>{userItem.organization}</Text>
          )}
        </View>

        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={() => isFollowing ? handleUnfollow(userItem.id) : handleFollow(userItem.id)}
          >
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>Discover and connect with professionals</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>Pull to refresh</Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {users.map(renderUserCard)}
          </View>
        )}
      </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  userList: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userProfession: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 4,
  },
  userOrganization: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#007AFF',
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});
