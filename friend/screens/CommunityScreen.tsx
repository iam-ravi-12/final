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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import communityService, { CommunityResponse } from '../services/communityService';

type TabType = 'my' | 'public';

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [myCommunities, setMyCommunities] = useState<CommunityResponse[]>([]);
  const [publicCommunities, setPublicCommunities] = useState<CommunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const [my, publicComm] = await Promise.all([
        communityService.getMyCommunities(),
        communityService.getPublicCommunities(),
      ]);
      setMyCommunities(my);
      setPublicCommunities(publicComm);
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCommunities();
    setRefreshing(false);
  };

  const handleJoinToggle = async (communityId: number, isMember: boolean) => {
    try {
      if (isMember) {
        await communityService.leaveCommunity(communityId);
        Alert.alert('Success', 'Left community successfully');
      } else {
        await communityService.joinCommunity(communityId);
        Alert.alert('Success', 'Joined community successfully');
      }
      await loadCommunities();
    } catch (error) {
      console.error('Error toggling membership:', error);
      Alert.alert('Error', 'Failed to update membership');
    }
  };

  const handleCommunityPress = (communityId: number, communityName: string) => {
    router.push({
      pathname: '/community/[communityId]' as any,
      params: { communityId: communityId.toString(), communityName },
    });
  };

  const renderCommunity = ({ item }: { item: CommunityResponse }) => {
    const initial = item.name.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.communityCard}
        onPress={() => handleCommunityPress(item.id, item.name)}
      >
        <View style={styles.communityHeader}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.communityPic} />
          ) : (
            <View style={[styles.communityAvatar, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.communityInfo}>
            <View style={styles.communityTitleRow}>
              <Text style={styles.communityName}>{item.name}</Text>
              {item.isPrivate && (
                <Ionicons name="lock-closed" size={16} color="#666" style={styles.lockIcon} />
              )}
            </View>
            {item.description && (
              <Text style={styles.communityDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.communityMeta}>
              {item.memberCount} members • by @{item.adminUsername}
            </Text>
          </View>
        </View>
        
        {activeTab === 'public' && (
          <TouchableOpacity
            style={[styles.joinButton, item.isMember && styles.memberButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleJoinToggle(item.id, item.isMember);
            }}
          >
            <Text style={[styles.joinButtonText, item.isMember && styles.memberButtonText]}>
              {item.isMember ? 'Leave' : 'Join'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const currentData = activeTab === 'my' ? myCommunities : publicCommunities;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Communities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'public' && styles.activeTab]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
            Public Communities
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentData}
        renderItem={renderCommunity}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {activeTab === 'my' ? 'You haven\'t joined any communities yet' : 'No public communities available'}
            </Text>
          </View>
        }
      />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  communityCard: {
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
  communityHeader: {
    flexDirection: 'row',
  },
  communityPic: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  communityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  communityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  communityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lockIcon: {
    marginLeft: 6,
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  communityMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  memberButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  memberButtonText: {
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});
