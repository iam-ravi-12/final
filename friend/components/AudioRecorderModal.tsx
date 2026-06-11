import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AudioRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the local URI and MIME type of the recorded audio */
  onCapture: (uri: string, mimeType: string) => void;
}

interface RecordingEntry {
  uri: string;
  duration: number; // seconds
  label: string;    // e.g. "Recording 1"
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function AudioRecorderModal({
  visible,
  onClose,
  onCapture,
}: AudioRecorderModalProps) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  // Playback state
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordCountRef = useRef(0);

  // Animation – pulsing red dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── Permission ────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    setCheckingPermission(true);
    const { granted } = await Audio.requestPermissionsAsync();
    setPermissionGranted(granted);
    setCheckingPermission(false);
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Microphone permission is needed to record audio.',
      );
    }
    return granted;
  }, []);

  useEffect(() => {
    if (visible) requestPermission();
  }, [visible]);

  // ── Reset when modal closes ───────────────────────────
  useEffect(() => {
    if (!visible) {
      stopTimer();
      stopPlayback();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      setIsRecording(false);
      setIsPaused(false);
      setRecordingSeconds(0);
      setRecordings([]);
      recordCountRef.current = 0;
      pulseLoop.current?.stop();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopPlayback();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  // ── Timer helpers ─────────────────────────────────────
  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Pulse animation ───────────────────────────────────
  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  };

  // ── Recording controls ────────────────────────────────
  const startRecording = async () => {
    const ok = permissionGranted || (await requestPermission());
    if (!ok) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;

      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      startTimer();
      startPulse();
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    if (!recordingRef.current || !isRecording) return;
    try {
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
      stopTimer();
      stopPulse();
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  };

  const resumeRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.startAsync();
      setIsPaused(false);
      startTimer();
      startPulse();
    } catch (err) {
      console.error('Failed to resume:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    stopTimer();
    stopPulse();

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        recordCountRef.current += 1;
        const entry: RecordingEntry = {
          uri,
          duration: recordingSeconds,
          label: `Recording ${recordCountRef.current}`,
        };
        setRecordings(prev => [...prev, entry]);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    } finally {
      setIsRecording(false);
      setIsPaused(false);
      setRecordingSeconds(0);

      // Restore audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    }
  };

  const deleteRecording = (uri: string) => {
    if (playingUri === uri) stopPlayback();
    setRecordings(prev => prev.filter(r => r.uri !== uri));
  };

  // ── Playback ──────────────────────────────────────────
  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingUri(null);
    setPlaybackSeconds(0);
    setPlaybackDuration(0);
  };

  const togglePlayback = async (uri: string, duration: number) => {
    // Stop any current playback first
    if (playingUri === uri) {
      await stopPlayback();
      return;
    }
    await stopPlayback();

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setPlaybackSeconds(Math.floor((status.positionMillis ?? 0) / 1000));
          setPlaybackDuration(Math.floor((status.durationMillis ?? duration * 1000) / 1000));
          if (status.didJustFinish) {
            setPlayingUri(null);
            setPlaybackSeconds(0);
          }
        },
      );
      soundRef.current = sound;
      setPlayingUri(uri);
    } catch (err) {
      console.error('Playback error:', err);
      Alert.alert('Error', 'Could not play this recording.');
    }
  };

  // ── Use a recording (send to post) ───────────────────
  const useRecording = (entry: RecordingEntry) => {
    stopPlayback();
    // m4a on iOS, 3gp/aac on Android
    const mimeType = Platform.OS === 'ios' ? 'audio/x-m4a' : 'audio/mpeg';
    onCapture(entry.uri, mimeType);
    onClose();
  };

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (isRecording) stopRecording();
        else onClose();
      }}
    >
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              if (isRecording) stopRecording().then(onClose);
              else onClose();
            }}
          >
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Recorder</Text>
          <View style={{ width: 36 }} />
        </View>

        {checkingPermission ? (
          <View style={styles.centeredBox}>
            <Ionicons name="mic-outline" size={56} color="#ccc" />
            <Text style={styles.emptyText}>Checking permission…</Text>
          </View>
        ) : !permissionGranted ? (
          <View style={styles.centeredBox}>
            <Ionicons name="mic-off-outline" size={64} color="#FF3B30" />
            <Text style={styles.permTitle}>Microphone Access Needed</Text>
            <Text style={styles.permText}>
              Grant microphone permission to record audio.
            </Text>
            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
              <Text style={styles.grantBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Waveform / Timer area ──────────────── */}
            <View style={styles.recorderArea}>
              {/* Animated mic ring */}
              <View style={styles.micRingOuter}>
                <Animated.View
                  style={[
                    styles.micRingPulse,
                    isRecording && !isPaused && {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.5],
                        outputRange: [0.25, 0],
                      }),
                    },
                  ]}
                />
                <View
                  style={[
                    styles.micRingInner,
                    isRecording && !isPaused && styles.micRingActive,
                    isPaused && styles.micRingPaused,
                  ]}
                >
                  <Ionicons
                    name={isRecording ? (isPaused ? 'pause' : 'mic') : 'mic-outline'}
                    size={36}
                    color={isRecording && !isPaused ? '#fff' : isRecording && isPaused ? '#FF9500' : '#007AFF'}
                  />
                </View>
              </View>

              {/* Status + timer */}
              <Text style={styles.timerText}>
                {isRecording ? formatTime(recordingSeconds) : '00:00'}
              </Text>
              <Text style={styles.statusText}>
                {isRecording
                  ? isPaused
                    ? 'Paused'
                    : 'Recording…'
                  : recordings.length > 0
                  ? 'Tap + to record another'
                  : 'Tap the mic to start recording'}
              </Text>

              {/* Simulated waveform bars */}
              {isRecording && !isPaused && (
                <View style={styles.waveRow}>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <WaveBar key={i} delay={i * 60} />
                  ))}
                </View>
              )}
            </View>

            {/* ── Control buttons ────────────────────── */}
            <View style={styles.controlRow}>
              {!isRecording ? (
                /* START button */
                <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
                  <Ionicons name="mic" size={30} color="#fff" />
                </TouchableOpacity>
              ) : (
                <>
                  {/* PAUSE / RESUME */}
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={isPaused ? resumeRecording : pauseRecording}
                  >
                    <Ionicons
                      name={isPaused ? 'play' : 'pause'}
                      size={22}
                      color="#007AFF"
                    />
                  </TouchableOpacity>

                  {/* STOP */}
                  <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
                    <View style={styles.stopSquare} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* ── Recordings list ────────────────────── */}
            {recordings.length > 0 && (
              <ScrollView style={styles.recordingsList} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
                <Text style={styles.listTitle}>Your Recordings</Text>
                {recordings.map((rec) => {
                  const isPlaying = playingUri === rec.uri;
                  return (
                    <View key={rec.uri} style={styles.recordingCard}>
                      {/* Play / stop */}
                      <TouchableOpacity
                        style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                        onPress={() => togglePlayback(rec.uri, rec.duration)}
                      >
                        <Ionicons
                          name={isPlaying ? 'stop' : 'play'}
                          size={18}
                          color={isPlaying ? '#fff' : '#007AFF'}
                        />
                      </TouchableOpacity>

                      {/* Info */}
                      <View style={styles.recInfo}>
                        <Text style={styles.recLabel}>{rec.label}</Text>
                        <Text style={styles.recDuration}>
                          {isPlaying
                            ? `${formatTime(playbackSeconds)} / ${formatTime(playbackDuration || rec.duration)}`
                            : formatTime(rec.duration)}
                        </Text>
                      </View>

                      {/* Use this recording */}
                      <TouchableOpacity
                        style={styles.useBtn}
                        onPress={() => useRecording(rec)}
                      >
                        <Text style={styles.useBtnText}>Use</Text>
                      </TouchableOpacity>

                      {/* Delete */}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteRecording(rec.uri)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Animated waveform bar
// ─────────────────────────────────────────────────────────
function WaveBar({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const height = 8 + Math.random() * 22;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay % 400),
        Animated.timing(anim, {
          toValue: height / 30,
          duration: 250 + Math.random() * 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 250 + Math.random() * 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { transform: [{ scaleY: anim }] },
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const BLUE = '#007AFF';
const RED  = '#FF3B30';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // ── Header ─────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },

  // ── Recorder area ───────────────────────────────────────
  recorderArea: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
    marginBottom: 1,
  },

  // Mic ring animations
  micRingOuter: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  micRingPulse: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: RED,
  },
  micRingInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#D1E5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRingActive: {
    backgroundColor: RED,
    borderColor: RED,
  },
  micRingPaused: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9500',
  },

  timerText: {
    fontSize: 42,
    fontWeight: '200',
    color: '#111',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
  },

  // Waveform
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 3,
    marginTop: 16,
  },
  waveBar: {
    width: 3,
    height: 30,
    borderRadius: 2,
    backgroundColor: RED,
    opacity: 0.8,
  },

  // ── Controls ────────────────────────────────────────────
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  stopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  stopSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#D1E5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Recordings list ─────────────────────────────────────
  recordingsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1E5FF',
  },
  playBtnActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  recInfo: {
    flex: 1,
  },
  recLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  recDuration: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  useBtn: {
    backgroundColor: BLUE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  useBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    padding: 4,
  },

  // ── Permission / empty ──────────────────────────────────
  centeredBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 15,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  permText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  grantBtn: {
    marginTop: 8,
    backgroundColor: BLUE,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  grantBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
