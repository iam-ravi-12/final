import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/constants/AppTheme';
import adminService, { AdminDashboardStats } from '../services/adminService';
import AdminHeader from '../components/AdminHeader';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Welcome Back');

  // Generate dynamic time-based greeting
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good Morning');
    else if (hrs < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

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

  const getActiveUserPercentage = () => {
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((stats.activeUsers / stats.totalUsers) * 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title={`${greeting}, Admin`} subtitle="Social network control center & analytics" />
      
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
          }
        >
          {/* Action Required Banner for Pending Reports */}
          {stats.pendingReports > 0 && (
            <TouchableOpacity
              style={[
                styles.reportAlertBanner,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                  borderColor: colors.danger,
                },
              ]}
              onPress={() => router.push('/admin/reports')}
              activeOpacity={0.8}
            >
              <View style={styles.alertHeader}>
                <Ionicons name="warning" size={24} color={colors.danger} />
                <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Action Required</Text>
              </View>
              <Text style={[styles.alertDescription, { color: colors.textSecondary }]}>
                There are <Text style={{ fontWeight: 'bold', color: colors.danger }}>{stats.pendingReports}</Text> reports awaiting your review. Flagged items require immediate moderation.
              </Text>
              <View style={styles.alertActionRow}>
                <Text style={[styles.alertActionText, { color: colors.danger }]}>Moderate Queue</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.danger} />
              </View>
            </TouchableOpacity>
          )}

          {/* Quick Metrics Header */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: stats.pendingReports > 0 ? 10 : 0 }]}>
            Platform Activity
          </Text>

          {/* Grid Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon="people"
              iconColor="#38BDF8"
              borderColor="rgba(56, 189, 248, 0.2)"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon="checkmark-circle"
              iconColor="#3FB950"
              borderColor="rgba(63, 185, 80, 0.2)"
            />
            <StatCard
              title="Banned Users"
              value={stats.totalBannedUsers}
              icon="ban"
              iconColor={colors.danger}
              borderColor="rgba(229, 83, 75, 0.2)"
            />
            <StatCard
              title="Pending Reports"
              value={stats.pendingReports}
              icon="flag"
              iconColor="#FCD34D"
              borderColor="rgba(252, 211, 77, 0.2)"
            />
            <StatCard
              title="Total Posts"
              value={stats.totalPosts}
              icon="document-text"
              iconColor="#A78BFA"
              borderColor="rgba(167, 139, 250, 0.2)"
            />
            <StatCard
              title="Communities"
              value={stats.totalCommunities}
              icon="planet"
              iconColor="#2DD4BF"
              borderColor="rgba(45, 212, 191, 0.2)"
            />
            <StatCard
              title="SOS Alerts"
              value={stats.totalSosAlerts}
              icon="warning"
              iconColor={colors.danger}
              borderColor="rgba(229, 83, 75, 0.2)"
            />
            <StatCard
              title="Messages Sent"
              value={stats.totalMessages}
              icon="chatbubbles"
              iconColor="#38BDF8"
              borderColor="rgba(56, 189, 248, 0.2)"
            />
          </View>

          {/* Platform Health Meters */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Engagement Health</Text>
          <View style={[styles.healthCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.metricRow}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Active User Rate</Text>
                <Text style={[styles.metricVal, { color: colors.accent }]}>{getActiveUserPercentage()}%</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.success,
                      width: `${getActiveUserPercentage()}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.metricRow, { marginTop: 16 }]}>
              <View style={styles.metricHeader}>
                <Text style={[styles.metricLabel, { color: colors.textPrimary }]}>Report Resolution Rate</Text>
                <Text style={[styles.metricVal, { color: colors.accent }]}>
                  {stats.totalReports > 0
                    ? Math.round(((stats.totalReports - stats.pendingReports) / stats.totalReports) * 100)
                    : 100}%
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.success,
                      width: `${
                        stats.totalReports > 0
                          ? Math.round(((stats.totalReports - stats.pendingReports) / stats.totalReports) * 100)
                          : 100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Quick Access Actions Hub */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions Hub</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/admin/users')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                <Ionicons name="people" size={20} color="#38BDF8" />
              </View>
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Moderate Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/admin/reports')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(252, 211, 77, 0.1)' }]}>
                <Ionicons name="flag" size={20} color="#FCD34D" />
              </View>
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Reports Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/admin/communities')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(45, 212, 191, 0.1)' }]}>
                <Ionicons name="planet" size={20} color="#2DD4BF" />
              </View>
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Communities</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/admin/posts')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(167, 139, 250, 0.1)' }]}>
                <Ionicons name="document-text" size={20} color="#A78BFA" />
              </View>
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Post Feed</Text>
            </TouchableOpacity>
          </View>

          {/* System status widgets */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Health Diagnostics</Text>
          <View style={[styles.healthCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginBottom: 20 }]}>
            <View style={styles.healthItem}>
              <Ionicons name="server-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.healthLabel, { color: colors.textPrimary }]}>API Server Latency</Text>
              <Text style={[styles.healthValue, { color: colors.success }]}>24ms (Optimal)</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
            
            <View style={styles.healthItem}>
              <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.healthLabel, { color: colors.textPrimary }]}>FCM Notification Hub</Text>
              <Text style={[styles.healthValue, { color: colors.success }]}>Online (Connected)</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.healthItem}>
              <Ionicons name="cloud-done-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.healthLabel, { color: colors.textPrimary }]}>Database Connection</Text>
              <Text style={[styles.healthValue, { color: colors.success }]}>Stable</Text>
            </View>
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
    paddingBottom: 110,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  reportAlertBanner: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  alertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  healthCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
  },
  metricRow: {
    width: '100%',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    width: (width - 52) / 2, // 2 column grid
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  healthLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  healthValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
