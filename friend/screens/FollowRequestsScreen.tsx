import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import followService, { FollowResponse } from '../services/followService';
import { useAppTheme } from '../constants/AppTheme';

export default function FollowRequestsScreen() {
  const [requests, setRequests] = useState<FollowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const { colors, isDark } = useAppTheme();

  const loadRequests = useCallback(async () => {
    try {
      const data = await followService.getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load follow requests:', error);
      Alert.alert('Error', 'Failed to load follow requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const handleAccept = useCallback(async (followId: number) => {
    if (processingIds.has(followId)) return;

    setProcessingIds(prev => new Set(prev).add(followId));
    
    try {
      await followService.acceptFollowRequest(followId);
      Alert.alert('Success', 'Follow request accepted');
      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== followId));
    } catch (error) {
      console.error('Failed to accept request:', error);
      Alert.alert('Error', 'Failed to accept request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(followId);
        return newSet;
      });
    }
  }, [processingIds]);

  const handleReject = useCallback(async (followId: number) => {
    if (processingIds.has(followId)) return;

    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this follow request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => new Set(prev).add(followId));
            
            try {
              await followService.rejectFollowRequest(followId);
              Alert.alert('Success', 'Follow request rejected');
              // Remove from list
              setRequests(prev => prev.filter(req => req.id !== followId));
            } catch (error) {
              console.error('Failed to reject request:', error);
              Alert.alert('Error', 'Failed to reject request');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(followId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  }, [processingIds]);

  const renderRequestItem = useCallback(({ item }: { item: FollowResponse }) => {
    const isProcessing = processingIds.has(item.id);
    
    return (
      <View style={[styles.requestItem, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          style={styles.userSection}
          onPress={() => router.push(`/user/${item.followerId}`)}
          disabled={isProcessing}
        >
          <View style={styles.avatar}>
            {item.profilePicture ? (
              <Image
                source={{ uri: item.profilePicture }}
                style={styles.avatarPlaceholder}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                  {item.followerUsername?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{item.followerUsername}</Text>
            {item.name && <Text style={[styles.name, { color: colors.textSecondary }]}>{item.name}</Text>}
            {item.profession && (
              <Text style={[styles.profession, { color: colors.textTertiary }]}>{item.profession}</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons name="checkmark" size={20} color={colors.textInverse} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.danger }]}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons name="close" size={20} color={colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [processingIds, handleAccept, handleReject, colors]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Follow Requests</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Follow Requests</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No pending follow requests</Text>
          </View>
        }
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  listContainer: {
    flexGrow: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  name: {
    fontSize: 14,
    marginTop: 2,
  },
  profession: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
