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

export default function FollowRequestsScreen() {
  const [requests, setRequests] = useState<FollowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

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
      <View style={styles.requestItem}>
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
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.followerUsername?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.followerUsername}</Text>
            {item.name && <Text style={styles.name}>{item.name}</Text>}
            {item.profession && (
              <Text style={styles.profession}>{item.profession}</Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="close" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [processingIds, handleAccept, handleReject]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Follow Requests</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow Requests</Text>
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
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No pending follow requests</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  name: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profession: {
    fontSize: 13,
    color: '#999',
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
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
