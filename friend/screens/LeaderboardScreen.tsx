import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import sosService, { LeaderboardResponse } from '../services/sosService';
import { useAppTheme } from '../constants/AppTheme';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await sosService.getLeaderboard(50);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getBadgeIcon = (badge: string | null) => {
    switch (badge) {
      case 'GOLD':
        return '🥇';
      case 'SILVER':
        return '🥈';
      case 'BRONZE':
        return '🥉';
      default:
        return '';
    }
  };

  const getBadgeColor = (badge: string | null) => {
    switch (badge) {
      case 'GOLD':
        return '#FFD700';
      case 'SILVER':
        return '#C0C0C0';
      case 'BRONZE':
        return '#CD7F32';
      default:
        return '#667eea';
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardResponse }) => (
    <View
      style={[
        styles.leaderboardItem,
        { backgroundColor: colors.surface, shadowColor: colors.shadow },
        item.badge && { borderLeftColor: getBadgeColor(item.badge), borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#{item.rank}</Text>
      </View>

      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase()}</Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.nameContainer}>
          <Text style={[styles.username, { color: colors.textPrimary }]}>{item.username}</Text>
          {item.badge && (
            <Text style={styles.badgeIcon}>{getBadgeIcon(item.badge)}</Text>
          )}
        </View>
        <Text style={[styles.profession, { color: colors.textSecondary }]}>{item.profession || 'Community Member'}</Text>
      </View>

      <View style={styles.pointsContainer}>
        <Text style={styles.pointsNumber}>{item.leaderboardPoints}</Text>
        <Text style={[styles.pointsLabel, { color: colors.textTertiary }]}>pts</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Community Heroes</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setInfoModalVisible(true)}
        >
          <Ionicons name="information-circle" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Data Yet</Text>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Be the first to help someone and earn points!
          </Text>
        </View>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.slice(0, 3).length > 0 && (
            <View style={[styles.podiumContainer, { backgroundColor: colors.surface }]}>
              {leaderboard.slice(0, 3).map((user) => (
                <View key={user.userId} style={styles.podiumCard}>
                  <Text style={styles.podiumBadge}>{getBadgeIcon(user.badge)}</Text>
                  <View style={styles.podiumAvatar}>
                    <Text style={styles.podiumAvatarText}>
                      {user.username?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.podiumUsername, { color: colors.textPrimary }]}>{user.username}</Text>
                  <Text style={styles.podiumPoints}>{user.leaderboardPoints} pts</Text>
                </View>
              ))}
            </View>
          )}

          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.userId.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </>
      )}

      {/* Info Modal */}
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.surfaceBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>How to Earn Points</Text>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.pointsBreakdown}>
                <View style={[styles.pointItem, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.pointAction, { color: colors.textPrimary }]}>On My Way</Text>
                  <Text style={[styles.pointValue, { color: colors.success }]}>+10 pts</Text>
                </View>
                <View style={[styles.pointItem, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.pointAction, { color: colors.textPrimary }]}>Contacted Authorities</Text>
                  <Text style={[styles.pointValue, { color: colors.success }]}>+15 pts</Text>
                </View>
                <View style={[styles.pointItem, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.pointAction, { color: colors.textPrimary }]}>Reached Location</Text>
                  <Text style={[styles.pointValue, { color: colors.success }]}>+25 pts</Text>
                </View>
                <View style={[styles.pointItem, { borderBottomColor: colors.surfaceBorder }]}>
                  <Text style={[styles.pointAction, { color: colors.textPrimary }]}>Situation Resolved</Text>
                  <Text style={[styles.pointValue, { color: colors.success }]}>+50 pts</Text>
                </View>
              </View>
              <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
                * Points awarded when help is confirmed by the alert owner
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    right: 20,
    top: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginBottom: 10,
  },
  podiumCard: {
    alignItems: 'center',
    padding: 10,
  },
  podiumBadge: {
    fontSize: 36,
    marginBottom: 10,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  podiumUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
  listContent: {
    padding: 15,
  },
  leaderboardItem: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  badgeIcon: {
    fontSize: 20,
  },
  profession: {
    fontSize: 13,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  pointsLabel: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  infoSection: {
    padding: 20,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pointsBreakdown: {
    marginBottom: 15,
  },
  pointItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  pointAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  pointValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoNote: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default LeaderboardScreen;
