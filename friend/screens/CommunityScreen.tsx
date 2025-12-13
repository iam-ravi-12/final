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
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import communityService, { CommunityResponse } from '../services/communityService';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { APP_URL } from '../constants/config';

type TabType = 'my' | 'public';

export default function CommunityScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [myCommunities, setMyCommunities] = useState<CommunityResponse[]>([]);
  const [publicCommunities, setPublicCommunities] = useState<CommunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleShareCommunity = async (community: CommunityResponse) => {
    try {
      const shareUrl = `${APP_URL}/community/${community.id}`;
      const message = `Join ${community.name} on our social network!\n\n${community.description}\n\n${shareUrl}`;
      
      if (Platform.OS === 'web') {
        // Web fallback
        await navigator.clipboard.writeText(shareUrl);
        Alert.alert('Link Copied', 'Community link copied to clipboard!');
      } else {
        // Native share
        await Share.share({
          title: `Join ${community.name}`,
          message,
          url: shareUrl,
        });
      }
    } catch (error) {
      console.error('Error sharing community:', error);
    }
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
              {item.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>👑 Admin</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text style={styles.communityDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.communityMeta}>
              {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>
        
        <View style={styles.communityActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={(e) => {
              e.stopPropagation();
              handleShareCommunity(item);
            }}
          >
            <Ionicons name="share-outline" size={20} color="#007AFF" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          
          {item.isMember ? (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleCommunityPress(item.id, item.name)}
            >
              <Text style={styles.viewButtonText}>View</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            !item.isPrivate && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleJoinToggle(item.id, item.isMember);
                }}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            )
          )}
        </View>
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Community Modal */}
      <CreateCommunityModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadCommunities}
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
    paddingBottom: 80, // Space for FAB
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
    marginBottom: 12,
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
    flexWrap: 'wrap',
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lockIcon: {
    marginLeft: 6,
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
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
  communityActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  shareButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
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
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
