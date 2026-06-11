import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type CaptureMode = 'photo' | 'video';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the local URI of the captured photo or video */
  onCapture: (uri: string, mimeType: string) => void;
}

export default function CameraModal({ visible, onClose, onCapture }: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [capturing, setCapturing] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const cameraRef = useRef<CameraView>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsRecording(false);
      setRecordingSeconds(0);
      setCapturing(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const requestPermissions = useCallback(async () => {
    const camResult = await requestCameraPermission();
    if (!camResult.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos/videos.');
      onClose();
      return false;
    }
    if (mode === 'video') {
      const micResult = await requestMicPermission();
      if (!micResult.granted) {
        Alert.alert('Permission Required', 'Microphone permission is needed to record video.');
        onClose();
        return false;
      }
    }
    return true;
  }, [mode, requestCameraPermission, requestMicPermission, onClose]);

  const handleVisibleChange = useCallback(async () => {
    if (visible && (!cameraPermission?.granted || (mode === 'video' && !micPermission?.granted))) {
      await requestPermissions();
    }
  }, [visible, cameraPermission, micPermission, mode, requestPermissions]);

  useEffect(() => {
    handleVisibleChange();
  }, [visible]);

  const toggleFacing = () => {
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(prev => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  const flashIcon = (): keyof typeof Ionicons.glyphMap => {
    if (flash === 'on') return 'flash';
    if (flash === 'auto') return 'flash-outline';
    return 'flash-off';
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri, 'image/jpeg');
        onClose();
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    // Ensure mic permission for video
    if (!micPermission?.granted) {
      const result = await requestMicPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Microphone permission is needed to record video.');
        return;
      }
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // max 60 seconds
      });
      if (video?.uri) {
        onCapture(video.uri, 'video/mp4');
        onClose();
      }
    } catch (err) {
      console.error('Error recording video:', err);
      // Don't show error if user stopped recording intentionally
    } finally {
      setIsRecording(false);
      setRecordingSeconds(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    try {
      cameraRef.current.stopRecording();
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  const handleCaptureButton = () => {
    if (mode === 'photo') {
      handleCapturePhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const permissionsGranted =
    cameraPermission?.granted && (mode !== 'video' || micPermission?.granted);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {
        if (isRecording) stopRecording();
        else onClose();
      }}
    >
      <View style={styles.container}>
        {permissionsGranted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              flash={flash}
              mode={mode === 'video' ? 'video' : 'picture'}
            />

            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.iconButton} onPress={onClose} disabled={isRecording}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>

              {/* Recording timer */}
              {isRecording && (
                <View style={styles.recordingBadge}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingTime}>{formatTime(recordingSeconds)}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.iconButton} onPress={toggleFlash} disabled={isRecording}>
                <Ionicons name={flashIcon()} size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Mode selector */}
            {!isRecording && (
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
                  onPress={() => setMode('photo')}
                >
                  <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>
                    PHOTO
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
                  onPress={() => setMode('video')}
                >
                  <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>
                    VIDEO
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Flip camera */}
              <TouchableOpacity style={styles.sideButton} onPress={toggleFacing} disabled={isRecording}>
                <Ionicons name="camera-reverse-outline" size={30} color="#fff" />
              </TouchableOpacity>

              {/* Capture / Record button */}
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  mode === 'video' && styles.captureButtonVideo,
                  isRecording && styles.captureButtonRecording,
                ]}
                onPress={handleCaptureButton}
                disabled={capturing}
              >
                {capturing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : mode === 'video' ? (
                  isRecording ? (
                    <View style={styles.stopIcon} />
                  ) : (
                    <View style={styles.recordIcon} />
                  )
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </TouchableOpacity>

              {/* Placeholder to balance layout */}
              <View style={styles.sideButton} />
            </View>
          </>
        ) : (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#666" />
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionText}>
              Please grant camera{mode === 'video' ? ' and microphone' : ''} permission to capture media.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelTextButton} onPress={onClose}>
              <Text style={styles.cancelTextButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Top controls ──────────────────────────────────────────────
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingTime: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // ── Mode selector ─────────────────────────────────────────────
  modeSelector: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  modeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  modeTextActive: {
    color: '#fff',
  },

  // ── Bottom controls ───────────────────────────────────────────
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  sideButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonVideo: {
    borderColor: '#FF3B30',
    borderWidth: 4,
  },
  captureButtonRecording: {
    backgroundColor: '#FF3B30',
    borderColor: 'rgba(255,59,48,0.4)',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  recordIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF3B30',
  },
  stopIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // ── Permission screen ─────────────────────────────────────────
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelTextButton: {
    marginTop: 4,
  },
  cancelTextButtonText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
  },
});
