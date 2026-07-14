import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/constants/AppTheme';
import adminService, { AdminDashboardStats } from '../services/adminService';
import AdminHeader from '../components/AdminHeader';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    fetchStats(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title="Dashboard" subtitle="Overview of your social network stats" />
      
      {loading ? (
        <View style={styles.contentPadding}>
          <LoadingSkeleton type="stat" count={8} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Stats"
          description={error}
          actionLabel="Try Again"
          onAction={() => fetchStats()}
        />
      ) : stats ? (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
          }
        >
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon="people"
              iconColor="#38BDF8"
              borderColor="rgba(56, 189, 248, 0.25)"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon="checkmark-circle"
              iconColor="#3FB950"
              borderColor="rgba(63, 185, 80, 0.25)"
            />
            <StatCard
              title="Banned Users"
              value={stats.totalBannedUsers}
              icon="ban"
              iconColor="#E5534B"
              borderColor="rgba(229, 83, 75, 0.25)"
            />
            <StatCard
              title="Reports Received"
              value={stats.totalReports}
              icon="flag"
              iconColor="#D29922"
              borderColor="rgba(210, 153, 34, 0.25)"
            />
            <StatCard
              title="Total Posts"
              value={stats.totalPosts}
              icon="document-text"
              iconColor="#A78BFA"
              borderColor="rgba(167, 139, 250, 0.25)"
            />
            <StatCard
              title="Communities"
              value={stats.totalCommunities}
              icon="planet"
              iconColor="#2DD4BF"
              borderColor="rgba(45, 212, 191, 0.25)"
            />
            <StatCard
              title="SOS Alerts"
              value={stats.totalSosAlerts}
              icon="warning"
              iconColor="#E5534B"
              borderColor="rgba(229, 83, 75, 0.25)"
            />
            <StatCard
              title="Messages Sent"
              value={stats.totalMessages}
              icon="chatbubbles"
              iconColor="#38BDF8"
              borderColor="rgba(56, 189, 248, 0.25)"
            />
          </View>
        </ScrollView>
      ) : (
        <EmptyState
          icon="bar-chart-outline"
          title="No Data Available"
          description="Dashboard statistics could not be loaded."
          actionLabel="Refresh"
          onAction={() => fetchStats()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100, // Safe space above bottom tab bar
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
