import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import sosService, { SosAlertResponse, SosResponseRequest } from '../services/sosService';

const SosAlertsScreen = () => {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SosAlertResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SosAlertResponse | null>(null);
  const [responseType, setResponseType] = useState<'ON_WAY' | 'CONTACTED_AUTHORITIES' | 'REACHED' | 'RESOLVED'>('ON_WAY');
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    getLocation();
    loadAlerts();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await sosService.getActiveAlerts(
        location?.latitude,
        location?.longitude,
        50
      );
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      Alert.alert('Error', 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleRespond = (alert: SosAlertResponse) => {
    setSelectedAlert(alert);
    setResponseType('ON_WAY');
    setResponseMessage('');
  };

  const submitResponse = async () => {
    if (!selectedAlert || isResponding) return;

    setIsResponding(true);
    try {
      const responseData: SosResponseRequest = {
        sosAlertId: selectedAlert.id,
        responseType: responseType,
        message: responseMessage || `I'm ${getResponseLabel(responseType).toLowerCase()}`,
      };

      await sosService.respondToAlert(responseData);
      Alert.alert(
        'Success',
        'Response submitted! You earned leaderboard points for helping.',
        [{ text: 'OK' }]
      );
      setSelectedAlert(null);
      setResponseMessage('');
      loadAlerts();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit response: ' + (error.message || error));
    } finally {
      setIsResponding(false);
    }
  };

  const getResponseLabel = (type: string) => {
    switch (type) {
      case 'ON_WAY':
        return 'On My Way';
      case 'CONTACTED_AUTHORITIES':
        return 'Contacted Authorities';
      case 'REACHED':
        return 'Reached Location';
      case 'RESOLVED':
        return 'Resolved';
      default:
        return type;
    }
  };

  const getEmergencyTypeLabel = (type: string) => {
    switch (type) {
      case 'GENERAL':
        return '🚨 General Emergency';
      case 'ACCIDENT':
        return '🚑 Accident';
      case 'WOMEN_SAFETY':
        return '👩 Women Safety';
      case 'MEDICAL':
        return '⚕️ Medical';
      case 'FIRE':
        return '🔥 Fire';
      default:
        return type;
    }
  };

  const formatDistance = (distance: number | null) => {
    if (!distance) return 'Unknown distance';
    return distance < 1
      ? `${(distance * 1000).toFixed(0)} meters away`
      : `${distance.toFixed(1)} km away`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  const renderAlertCard = ({ item }: { item: SosAlertResponse }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.emergencyBadge}>
          <Text style={styles.emergencyBadgeText}>
            {getEmergencyTypeLabel(item.emergencyType)}
          </Text>
        </View>
        <Text style={styles.timeBadge}>{formatTime(item.createdAt)}</Text>
      </View>

      <View style={styles.alertUser}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.username?.[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userProfession}>
            {item.userProfession || 'Community Member'}
          </Text>
        </View>
      </View>

      {item.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      )}

      {item.distance !== null && (
        <Text style={styles.distance}>📍 {formatDistance(item.distance)}</Text>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.stats}>
          👥 {item.responseCount} responder{item.responseCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.respondButton}
        onPress={() => handleRespond(item)}
      >
        <Text style={styles.respondButtonText}>Respond to Alert</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Active SOS Alerts</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#ff0000" style={styles.loader} />
      ) : alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>✅ No Active SOS Alerts</Text>
          <Text style={styles.emptyText}>
            Great! There are no active emergencies in your area.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Modal
        visible={selectedAlert !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Respond to SOS Alert</Text>
            <Text style={styles.modalUsername}>
              Helping: {selectedAlert?.username}
            </Text>

            <View style={styles.responseTypeContainer}>
              <Text style={styles.label}>Response Type:</Text>
              {['ON_WAY', 'CONTACTED_AUTHORITIES', 'REACHED', 'RESOLVED'].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.responseTypeButton,
                      responseType === type && styles.responseTypeButtonActive,
                    ]}
                    onPress={() => setResponseType(type as any)}
                  >
                    <Text
                      style={[
                        styles.responseTypeText,
                        responseType === type && styles.responseTypeTextActive,
                      ]}
                    >
                      {getResponseLabel(type)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <View style={styles.messageContainer}>
              <Text style={styles.label}>Message (Optional):</Text>
              <TextInput
                style={styles.messageInput}
                value={responseMessage}
                onChangeText={setResponseMessage}
                placeholder="Add any additional information..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.pointsInfo}>
              <Text style={styles.pointsInfoText}>
                💎 You'll earn leaderboard points for helping!
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSelectedAlert(null)}
                disabled={isResponding}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={submitResponse}
                disabled={isResponding}
              >
                {isResponding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#4caf50',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#ff0000',
    elevation: 4,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyBadge: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emergencyBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  timeBadge: {
    fontSize: 12,
    color: '#666',
  },
  alertUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
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
    marginBottom: 2,
  },
  userProfession: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsContainer: {
    marginBottom: 12,
  },
  stats: {
    fontSize: 14,
    color: '#666',
  },
  respondButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  respondButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalUsername: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  responseTypeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  responseTypeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  responseTypeButtonActive: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e9',
  },
  responseTypeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  responseTypeTextActive: {
    color: '#4caf50',
    fontWeight: '600',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#333',
  },
  pointsInfo: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  pointsInfoText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubmitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default SosAlertsScreen;
