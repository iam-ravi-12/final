import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import sosService, { SosAlertRequest } from '../services/sosService';

interface SosButtonProps {
  style?: any;
}

const SosButton: React.FC<SosButtonProps> = ({ style }) => {
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [emergencyType, setEmergencyType] = useState<'IMMEDIATE_EMERGENCY' | 'ACCIDENT' | 'WOMEN_SAFETY' | 'MEDICAL' | 'FIRE'>('IMMEDIATE_EMERGENCY');
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showModal && countdown === 0) {
      sendSOS();
    }
    return () => clearTimeout(timer);
  }, [showModal, countdown]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      setLocationError('Unable to get location');
      console.error('Location error:', error);
    }
  };

  const handleSosPress = () => {
    setShowModal(true);
    setCountdown(15);
  };

  const handleCancel = () => {
    setShowModal(false);
    setCountdown(15);
    setDescription('');
  };

  const sendSOS = async () => {
    if (isSending) return;

    setIsSending(true);
    try {
      const alertData: SosAlertRequest = {
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        locationAddress: 'User location',
        emergencyType: emergencyType,
        description: description || 'Emergency SOS alert sent',
      };

      await sosService.createSosAlert(alertData);
      Alert.alert(
        'SOS Sent!',
        'Your emergency alert has been sent to nearby community members and emergency services.',
        [{ text: 'OK' }]
      );
      setShowModal(false);
      setCountdown(15);
      setDescription('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send SOS: ' + (error.message || error));
    } finally {
      setIsSending(false);
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

  return (
    <>
      <TouchableOpacity
        style={[styles.sosButton, style]}
        onPress={handleSosPress}
        activeOpacity={0.7}
      >
        <Text style={styles.sosButtonText}>SOS</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚨 Emergency SOS</Text>

            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </View>

            <Text style={styles.modalMessage}>
              {countdown > 0
                ? `Alert will be sent in ${countdown} seconds`
                : 'Sending alert...'}
            </Text>

            {locationError && (
              <Text style={styles.locationError}>{locationError}</Text>
            )}

            <View style={styles.emergencyTypeContainer}>
              <Text style={styles.label}>Emergency Type:</Text>
              <View style={styles.typeButtons}>
                {['IMMEDIATE_EMERGENCY', 'ACCIDENT', 'WOMEN_SAFETY', 'MEDICAL', 'FIRE'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      emergencyType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setEmergencyType(type as any)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        emergencyType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {getEmergencyTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.label}>Additional Details (Optional):</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the emergency..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isSending}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendSOS}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.sendButtonText}>Send Now</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.infoText}>
              This will alert nearby community members and emergency services.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sosButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  countdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  modalMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    fontWeight: '500',
  },
  locationError: {
    fontSize: 14,
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: 'center',
  },
  emergencyTypeContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  typeButtons: {
    gap: 8,
  },
  typeButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    borderColor: '#ff0000',
    backgroundColor: '#fff0f0',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#ff0000',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sendButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ff0000',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SosButton;
