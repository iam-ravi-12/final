import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/constants/AppTheme';
import adminService from '../services/adminService';
import communityService from '@/services/communityService';
import { CommunityResponse } from '@/services/communityService';
import AdminHeader from '../components/AdminHeader';
import CommunityCard from '../components/CommunityCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';

export default function CommunitiesScreen() {
  const { colors } = useAppTheme();
  const { user: adminUser } = useAuth();

  // Data State
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityResponse | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCommunities = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await communityService.getPublicCommunities();
      setCommunities(data || []);
    } catch (err: any) {
      console.error('Error fetching communities:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load communities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const onRefresh = () => {
    fetchCommunities(true);
  };

  const handleDeleteCommunity = async () => {
    if (!selectedCommunity) return;

    setActionLoading(true);
    try {
      await adminService.deleteCommunity(selectedCommunity.id);
      Alert.alert('Success', 'Community deleted successfully');
      setConfirmDeleteVisible(false);
      fetchCommunities();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to delete community');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title="Communities" subtitle="Manage network groups and memberships" />

      {loading ? (
        <View style={styles.listContainer}>
          <LoadingSkeleton type="card" count={3} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Communities"
          description={error}
          actionLabel="Try Again"
          onAction={() => fetchCommunities()}
        />
      ) : communities.length === 0 ? (
        <EmptyState
          icon="people-circle-outline"
          title="No Communities Found"
          description="There are currently no communities on the network."
          actionLabel="Refresh"
          onAction={() => fetchCommunities()}
        />
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CommunityCard
              community={{
                id: item.id,
                name: item.name,
                description: item.description,
                isPrivate: item.isPrivate,
                profilePicture: item.profilePicture,
                adminId: item.adminId,
                adminUsername: item.adminUsername,
                memberCount: item.memberCount,
                createdAt: item.createdAt,
              }}
              onDelete={() => {
                setSelectedCommunity(item);
                setConfirmDeleteVisible(true);
              }}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Delete Community"
        message={`WARNING: Are you sure you want to delete "${selectedCommunity?.name}"? This action is permanent and will completely erase all community posts, memberships, and related data.`}
        confirmText="Delete"
        confirmColor={colors.danger}
        onConfirm={handleDeleteCommunity}
        onCancel={() => setConfirmDeleteVisible(false)}
        loading={actionLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
});
