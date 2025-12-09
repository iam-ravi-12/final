import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import followService, { FollowResponse } from '../../services/followService';
import { router } from 'expo-router';

export default function FollowListScreen() {
  const { userId, type } = useLocalSearchParams();
  const [follows, setFollows] = useState<FollowResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollows();
  }, [userId, type]);

  const loadFollows = async () => {
    if (!userId) return;

    try {
      let data: FollowResponse[] = [];
      if (type === 'followers') {
        data = await followService.getFollowers(Number(userId));
      } else if (type === 'following') {
        data = await followService.getFollowing(Number(userId));
      }
      setFollows(data);
    } catch (error) {
      console.error('Failed to load follows:', error);
      Alert.alert('Error', 'Failed to load list');
    } finally {
      setLoading(false);
    }
  };

  const renderFollowItem = ({ item }: { item: FollowResponse }) => {
    const username = type === 'followers' ? item.followerUsername : item.followingUsername;
    const userId = type === 'followers' ? item.followerId : item.followingId;

    return (
      <TouchableOpacity
        style={styles.followItem}
        onPress={() => router.push(`/user/${userId}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{username}</Text>
          {item.status && (
            <Text style={styles.status}>
              {item.status === 'ACCEPTED' ? 'Following' : item.status}
            </Text>
          )}
        </View>
        <IconSymbol name="chevron.right" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: type === 'followers' ? 'Followers' : 'Following',
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={follows}
            renderItem={renderFollowItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconSymbol name="person.2" size={60} color="#ccc" />
                <Text style={styles.emptyText}>
                  {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </>
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
  },
  listContainer: {
    flexGrow: 1,
  },
  followItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
