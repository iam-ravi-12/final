import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import adminService, { AdminSosResponse } from '../services/adminService';
import AdminHeader from '../components/AdminHeader';
import EmptyState from '../components/EmptyState';
import { formatRelativeDate } from '@/utils/helpers';

export default function SosReviewsScreen() {
  const { colors, isDark } = useAppTheme();
  
  const [reviews, setReviews] = useState<AdminSosResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchReviews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await adminService.getPendingSosResponses();
      setReviews(data);
    } catch (err: any) {
      console.error('Error fetching pending SOS responses:', err);
      Alert.alert('Error', 'Failed to load SOS responses for review');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = (id: number) => {
    Alert.alert(
      'Approve Response',
      'Are you sure you want to approve this response? Leaderboard points will be awarded to the responder.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setProcessingId(id);
            try {
              await adminService.approveSosResponse(id);
              Alert.alert('Approved', 'Response approved and points successfully awarded.');
              fetchReviews();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data || err.message || 'Failed to approve');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (id: number) => {
    Alert.alert(
      'Reject Response',
      'Are you sure you want to reject this response? No points will be awarded.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(id);
            try {
              await adminService.rejectSosResponse(id);
              Alert.alert('Rejected', 'Response has been rejected.');
              fetchReviews();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data || err.message || 'Failed to reject');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title="SOS Reviews" subtitle="Verify SOS responses & distribute points" />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="All Clear!"
          description="There are no pending SOS responses to review."
          actionLabel="Refresh"
          onAction={() => fetchReviews()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchReviews(true)} colors={[colors.accent]} />
          }
        >
          {reviews.map((item) => (
            <View
              key={item.id}
              style={[
                styles.reviewCard,
                { backgroundColor: colors.cardGlassBg, borderColor: colors.cardGlassBorder },
              ]}
            >
              {/* Emergency Alert Context Header */}
              <View style={[styles.alertSection, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                <View style={styles.alertHeaderRow}>
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Ionicons name="warning" size={12} color="#fff" />
                    <Text style={styles.badgeText}>{item.alertEmergencyType}</Text>
                  </View>
                  <Text style={[styles.dateText, { color: colors.textTertiary }]}>
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Raised By / For:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    @{item.alertOwnerUsername} ({item.alertOwnerEmail})
                  </Text>
                </View>

                {(item.alertLatitude !== undefined && item.alertLongitude !== undefined) && (
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Coordinates:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      🌐 Lat: {item.alertLatitude}, Lon: {item.alertLongitude}
                    </Text>
                  </View>
                )}

                {item.alertLocationAddress && (
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Address:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={2}>
                      📍 {item.alertLocationAddress}
                    </Text>
                  </View>
                )}

                {item.alertDescription && (
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Alert Details:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]} numberOfLines={2}>
                      "{item.alertDescription}"
                    </Text>
                  </View>
                )}
              </View>

              {/* Responder Reaction Details */}
              <View style={styles.responderSection}>
                <View style={styles.responderHeader}>
                  <Ionicons name="people-circle" size={24} color={colors.accent} />
                  <Text style={[styles.responderName, { color: colors.textPrimary }]}>
                    Responder: @{item.responderUsername} ({item.responderEmail})
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reaction Status:</Text>
                  <View style={[styles.actionBadge, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.actionBadgeText, { color: colors.accent }]}>
                      {item.responseType.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {item.message && (
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Message Sent:</Text>
                    <Text style={[styles.responderMessage, { color: colors.textPrimary }]}>
                      "{item.message}"
                    </Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pending Reward:</Text>
                  <Text style={[styles.pointsVal, { color: colors.success }]}>
                    🪙 +{item.pointsAwarded} Leaderboard Points
                  </Text>
                </View>
              </View>

              {/* Action Panel */}
              <View style={[styles.actionsRow, { borderTopColor: colors.surfaceBorder }]}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn, { borderColor: colors.danger }]}
                  onPress={() => handleReject(item.id)}
                  disabled={processingId === item.id}
                >
                  <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                  <Text style={[styles.actionBtnText, { color: colors.danger }]}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleApprove(item.id)}
                  disabled={processingId === item.id}
                >
                  {processingId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={[styles.actionBtnText, { color: '#fff' }]}>Approve & Reward</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 110,
  },
  reviewCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  alertSection: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 11,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 100,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
  responderSection: {
    marginBottom: 16,
  },
  responderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  responderName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  responderMessage: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  pointsVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
  },
  rejectBtn: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  approveBtn: {
    borderWidth: 0,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
