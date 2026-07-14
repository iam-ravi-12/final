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
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import communityService, { CommunityResponse } from '../services/communityService';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { APP_URL } from '../constants/config';
import { copyToClipboard, formatMemberCount } from '../utils/helpers';
import { useAppTheme } from '../constants/AppTheme';

type TabType = 'my' | 'public';

export default function CommunityScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);
  const fabBottom = bottomOffset + 62 + 16;
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [myCommunities, setMyCommunities] = useState<CommunityResponse[]>([]);
  const [publicCommunities, setPublicCommunities] = useState<CommunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        // Web fallback with proper error handling
        try {
          await copyToClipboard(shareUrl);
          Alert.alert('Link Copied', 'Community link copied to clipboard!');
        } catch (err) {
          Alert.alert('Error', 'Failed to copy link to clipboard');
        }
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
        style={[styles.communityCard, { backgroundColor: colors.cardGlassBg, borderColor: colors.cardGlassBorder, borderWidth: 1, shadowColor: isDark ? 'rgba(56, 189, 248, 0.06)' : colors.shadow }]}
        onPress={() => handleCommunityPress(item.id, item.name)}
      >
        <View style={styles.communityHeader}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.communityPic} />
          ) : (
            <View style={[styles.communityAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.avatarText, { color: colors.textInverse }]}>{initial}</Text>
            </View>
          )}
          <View style={styles.communityInfo}>
            <View style={styles.communityTitleRow}>
              <Text style={[styles.communityName, { color: colors.textPrimary }]}>{item.name}</Text>
              {item.isPrivate && (
                <Ionicons name="lock-closed" size={16} color={colors.textSecondary} style={styles.lockIcon} />
              )}
              {item.isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={[styles.adminBadgeText, { color: colors.textPrimary }]}>👑 Admin</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text style={[styles.communityDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={[styles.communityMeta, { color: colors.textTertiary }]}>
              {formatMemberCount(item.memberCount)} • by @{item.adminUsername}
            </Text>
          </View>
        </View>
        
        <View style={styles.communityActions}>
          <TouchableOpacity
            style={[styles.shareButton, { borderColor: colors.accent }]}
            onPress={(e) => {
              e.stopPropagation();
              handleShareCommunity(item);
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.accent} />
            <Text style={[styles.shareButtonText, { color: colors.accent }]}>Share</Text>
          </TouchableOpacity>
          
          {item.isMember ? (
            <TouchableOpacity
              style={[styles.viewButton, { backgroundColor: colors.accent }]}
              onPress={() => handleCommunityPress(item.id, item.name)}
            >
              <Text style={[styles.viewButtonText, { color: colors.textInverse }]}>View</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          ) : (
            !item.isPrivate && (
              <TouchableOpacity
                style={[styles.joinButton, { backgroundColor: colors.accent }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleJoinToggle(item.id, item.isMember);
                }}
              >
                <Text style={[styles.joinButtonText, { color: colors.textInverse }]}>Join</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Filter communities based on search query
  const filterCommunities = (communities: CommunityResponse[]) => {
    if (!searchQuery.trim()) {
      return communities;
    }
    
    const query = searchQuery.toLowerCase();
    return communities.filter(community => 
      community.name.toLowerCase().includes(query) ||
      community.description.toLowerCase().includes(query) ||
      community.adminUsername.toLowerCase().includes(query)
    );
  };

  const currentData = activeTab === 'my' ? myCommunities : publicCommunities;
  const filteredData = filterCommunities(currentData);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(8, 12, 22, 0.97)' : 'rgba(235, 244, 249, 0.92)' }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my' && {
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(10, 65, 116, 0.12)',
            },
          ]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'my' ? colors.accent : colors.textSecondary }, activeTab === 'my' && { fontWeight: '700' }]}>
            My Communities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'public' && {
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(10, 65, 116, 0.12)',
            },
          ]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'public' ? colors.accent : colors.textSecondary }, activeTab === 'public' && { fontWeight: '700' }]}>
            Public Communities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, shadowColor: colors.shadow }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.inputText }]}
          placeholder="Search communities..."
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderCommunity}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-circle-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {searchQuery.trim() 
                ? `No communities found matching "${searchQuery}"` 
                : activeTab === 'my' 
                  ? 'You haven\'t joined any communities yet' 
                  : 'No public communities available'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: isDark ? 'rgba(8, 12, 22, 0.96)' : 'rgba(0, 29, 57, 0.94)',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(123, 189, 232, 0.35)',
            borderWidth: 1.5,
            shadowColor: isDark ? '#38BDF8' : '#000000',
            bottom: fabBottom,
          },
        ]}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={isDark ? '#38BDF8' : '#7BBDE8'} />
      </TouchableOpacity>

      {/* Create Community Modal */}
      <CreateCommunityModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadCommunities}
      />
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  communityCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
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
  },
  communityDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  communityMeta: {
    fontSize: 12,
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
    gap: 6,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
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
    marginTop: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
