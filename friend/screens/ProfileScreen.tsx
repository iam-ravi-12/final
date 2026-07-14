import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import authService, { ProfileResponse } from '../services/authService';
import followService, { FollowStatsResponse } from '../services/followService';
import { useAppTheme } from '../constants/AppTheme';

export default function ProfileScreen() {
  const { colors, isDark } = useAppTheme();
  const { user, logout, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [followStats, setFollowStats] = useState<FollowStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      const [profile, stats] = await Promise.all([
        authService.getProfile(),
        followService.getFollowStats(user.id),
      ]);
      setProfileData(profile);
      setFollowStats(stats);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfileData(), refreshUser()]);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {profileData?.profilePicture || user?.profilePicture ? (
          <Image
            source={{ uri: profileData?.profilePicture || user?.profilePicture }}
            style={styles.avatarLarge}
            defaultSource={require('../assets/images/partial-react-logo.png')}
          />
        ) : (
          <View style={[styles.avatarLarge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarTextLarge, { color: colors.textInverse }]}>
              {profileData?.name?.charAt(0).toUpperCase() || 
               profileData?.username?.charAt(0).toUpperCase() || 
               user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.textPrimary }]}>
          {profileData?.name || user?.name || profileData?.username || user?.username}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{profileData?.email || user?.email}</Text>

        {/* Followers/Following Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/follows/${user?.id}?type=followers`)}
          >
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{followStats?.followersCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/follows/${user?.id}?type=following`)}
          >
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{followStats?.followingCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="briefcase" size={24} color={colors.accent} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Profession</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {profileData?.profession || user?.profession || 'Not set'}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="business" size={24} color={colors.accent} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Organization</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {profileData?.organization || user?.organization || 'Not set'}
            </Text>
          </View>
        </View>

        {(profileData?.location || user?.location) && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="location" size={24} color={colors.accent} />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {profileData?.location || user?.location}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.surfaceBorder }]}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit Profile</Text>
          <IconSymbol name="chevron.right" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.surfaceBorder }]}
          onPress={() => router.push('/follow-requests')}
        >
          <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Follow Requests</Text>
          <IconSymbol name="chevron.right" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.surfaceBorder }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.menuItemText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  email: {
    fontSize: 14,
    marginBottom: 20,
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
  menuSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
});
