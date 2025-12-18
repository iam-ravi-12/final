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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import sosService, { SosAlertResponse, SosResponseRequest } from '../services/sosService';
import notificationService from '../services/notificationService';
import { parseUTCDate } from '../utils/helpers';

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
    markAlertsAsRead();
    clearNotifications();
  }, []);

  const clearNotifications = async () => {
    try {
      // Clear app badge count
      await notificationService.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

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
        5 // Changed to 5km radius to match notification filtering
      );
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      Alert.alert('Error', 'Failed to load SOS alerts');
    } finally {
      setLoading(false);
    }
  };

  const markAlertsAsRead = async () => {
    try {
      await sosService.markAlertsAsRead();
    } catch (error) {
      console.error('Error marking alerts as read:', error);
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
      case 'IMMEDIATE_EMERGENCY':
        return '🚨 Immediate Emergency';
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

  const formatResponseType = (type: string) => {
    switch (type) {
      case 'ON_WAY':
        return 'On My Way';
      case 'CONTACTED_AUTHORITIES':
        return 'Contacted Authorities';
      case 'REACHED':
        return 'Reached Location';
      case 'RESOLVED':
        return 'Situation Resolved';
      default:
        return type;
    }
  };

  const formatTime = (timestamp: string) => {
    // Parse the timestamp - backend returns LocalDateTime in UTC
    const date = parseUTCDate(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  };

  const handleOpenMaps = (url: string) => {
    Linking.openURL(url).catch(err => {
      Alert.alert(
        'Unable to Open Maps', 
        'Could not open Google Maps. Please check if the app is installed or try opening the location manually.'
      );
      console.error('Failed to open maps:', err);
    });
  };

  const handleCallEmergency = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err => {
      Alert.alert(
        'Unable to Make Call', 
        `Could not initiate the call. Please dial manually: ${phoneNumber}`
      );
      console.error('Failed to make call:', err);
    });
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

      {item.googleMapsUrl && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => handleOpenMaps(item.googleMapsUrl!)}
        >
          <Text style={styles.locationButtonText}>🗺️ Open in Google Maps</Text>
        </TouchableOpacity>
      )}

      {item.emergencyContactNumber && (
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => handleCallEmergency(item.emergencyContactNumber!)}
        >
          <Text style={styles.emergencyButtonText}>
            📞 Call Emergency: {item.emergencyContactNumber}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.stats}>
          👥 {item.responseCount} responder{item.responseCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {item.hasCurrentUserResponded && (
        <View style={styles.respondedBadge}>
          <Text style={styles.respondedBadgeText}>✅ You have responded to this alert</Text>
          {item.currentUserResponseType && (
            <View style={styles.respondedDetails}>
              <Text style={styles.respondedDetailsText}>
                Response Type: {formatResponseType(item.currentUserResponseType)}
              </Text>
              {item.currentUserResponseMessage && (
                <Text style={styles.respondedDetailsText}>
                  Message: {item.currentUserResponseMessage}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {item.isCurrentUserAlertOwner && (
        <View style={styles.alertOwnerBadge}>
          <Text style={styles.alertOwnerBadgeText}>⚠️ This is your SOS alert</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.respondButton,
          (item.hasCurrentUserResponded || item.isCurrentUserAlertOwner) && styles.respondButtonDisabled,
        ]}
        onPress={() => handleRespond(item)}
        disabled={item.hasCurrentUserResponded || item.isCurrentUserAlertOwner}
      >
        <Text style={styles.respondButtonText}>
          {item.isCurrentUserAlertOwner
            ? 'Your Alert - Cannot Respond'
            : item.hasCurrentUserResponded && item.currentUserResponseType
            ? `Responded: ${formatResponseType(item.currentUserResponseType)}`
            : item.hasCurrentUserResponded
            ? 'Already Responded'
            : 'Respond to Alert'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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

            {selectedAlert?.googleMapsUrl && (
              <TouchableOpacity
                style={styles.modalLocationButton}
                onPress={() => handleOpenMaps(selectedAlert.googleMapsUrl!)}
              >
                <Text style={styles.modalLocationButtonText}>
                  🗺️ View Exact Location on Google Maps
                </Text>
              </TouchableOpacity>
            )}

            {selectedAlert?.emergencyContactNumber && (
              <TouchableOpacity
                style={styles.modalEmergencyButton}
                onPress={() => handleCallEmergency(selectedAlert.emergencyContactNumber!)}
              >
                <Text style={styles.modalEmergencyButtonText}>
                  📞 Call Emergency: {selectedAlert.emergencyContactNumber}
                </Text>
              </TouchableOpacity>
            )}

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 10,
    paddingTop: 10,
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
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ff0000',
    elevation: 3,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyBadge: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  emergencyBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  timeBadge: {
    fontSize: 11,
    color: '#666',
  },
  alertUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
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
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  distance: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  locationButton: {
    backgroundColor: '#4285f4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  emergencyButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 10,
  },
  stats: {
    fontSize: 13,
    color: '#666',
  },
  respondedBadge: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  respondedBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  respondedDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    width: '100%',
  },
  respondedDetailsText: {
    color: 'white',
    fontSize: 13,
    marginBottom: 4,
  },
  alertOwnerBadge: {
    backgroundColor: '#ff9800',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  alertOwnerBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  respondButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  respondButtonDisabled: {
    backgroundColor: '#9e9e9e',
    opacity: 0.6,
  },
  respondButtonText: {
    color: 'white',
    fontSize: 15,
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
  modalLocationButton: {
    backgroundColor: '#4285f4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLocationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalEmergencyButton: {
    backgroundColor: '#ff6b6b',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalEmergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
