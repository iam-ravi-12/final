import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import sosService, { LeaderboardResponse } from '../services/sosService';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
          <Text style={styles.username}>{item.username}</Text>
          {item.badge && (
            <Text style={styles.badgeIcon}>{getBadgeIcon(item.badge)}</Text>
          )}
        </View>
        <Text style={styles.profession}>{item.profession || 'Community Member'}</Text>
      </View>

      <View style={styles.pointsContainer}>
        <Text style={styles.pointsNumber}>{item.leaderboardPoints}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Community Heroes</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to help someone and earn points!
          </Text>
        </View>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.slice(0, 3).length > 0 && (
            <View style={styles.podiumContainer}>
              {leaderboard.slice(0, 3).map((user) => (
                <View key={user.userId} style={styles.podiumCard}>
                  <Text style={styles.podiumBadge}>{getBadgeIcon(user.badge)}</Text>
                  <View style={styles.podiumAvatar}>
                    <Text style={styles.podiumAvatarText}>
                      {user.username?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.podiumUsername}>{user.username}</Text>
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

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How to Earn Points</Text>
            <View style={styles.pointsBreakdown}>
              <View style={styles.pointItem}>
                <Text style={styles.pointAction}>On My Way</Text>
                <Text style={styles.pointValue}>+10 pts</Text>
              </View>
              <View style={styles.pointItem}>
                <Text style={styles.pointAction}>Contacted Authorities</Text>
                <Text style={styles.pointValue}>+15 pts</Text>
              </View>
              <View style={styles.pointItem}>
                <Text style={styles.pointAction}>Reached Location</Text>
                <Text style={styles.pointValue}>+25 pts</Text>
              </View>
              <View style={styles.pointItem}>
                <Text style={styles.pointAction}>Situation Resolved</Text>
                <Text style={styles.pointValue}>+50 pts</Text>
              </View>
            </View>
            <Text style={styles.infoNote}>
              * Points awarded when help is confirmed by the alert owner
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
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
    color: '#666',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
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
    color: '#333',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
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
    color: '#333',
  },
  badgeIcon: {
    fontSize: 20,
  },
  profession: {
    fontSize: 13,
    color: '#666',
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
    color: '#999',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    borderBottomColor: '#f0f0f0',
  },
  pointAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  pointValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  infoNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default LeaderboardScreen;
