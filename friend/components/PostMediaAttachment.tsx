import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { inferMediaType, PostMediaType } from '../utils/media';

interface PostMediaAttachmentProps {
  uri: string;
  mediaStyle: StyleProp<ImageStyle | ViewStyle>;
  /**
   * Optional hint for the media type. Useful when the caller knows the type
   * (e.g. from the original MIME type used during upload) but the URI alone
   * is not enough to determine it (e.g. Cloudinary URLs without a file extension).
   */
  hintMediaType?: PostMediaType;
}

const AUDIO_RATES = [1, 1.5, 2];
const UNKNOWN_MEDIA_ICON = 'attach-outline';
const UNKNOWN_MEDIA_TITLE = 'Attachment';

export default function PostMediaAttachment({ uri, mediaStyle, hintMediaType }: PostMediaAttachmentProps) {
  // Use hint or URI-based inference as the starting point
  const initialMediaType: PostMediaType = hintMediaType ?? inferMediaType(uri);
  const videoRef = useRef<Video>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const [mediaType, setMediaType] = useState<PostMediaType>(initialMediaType);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioRateIndex, setAudioRateIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioProbeFailed, setAudioProbeFailed] = useState(false);

  useEffect(() => {
    // Re-derive when URI or hint changes
    setMediaType(hintMediaType ?? inferMediaType(uri));
    setAudioProbeFailed(false);
    setAudioProgress(0);
  }, [hintMediaType, uri]);

  useEffect(() => {
    if (mediaType !== 'unknown' || !uri || audioProbeFailed) return;
    let isMounted = true;

    const resolveMediaType = async () => {
      let headContentType: string | null = null;

      // ── Step 1: HEAD request ─────────────────────────────────────────
      try {
        const response = await fetch(uri, { method: 'HEAD' });
        headContentType = response.headers.get('content-type')?.toLowerCase() ?? null;
        if (headContentType) {
          if (headContentType.startsWith('image/')) {
            if (isMounted) setMediaType('image');
            return;
          }
          if (headContentType.startsWith('audio/')) {
            if (isMounted) setMediaType('audio');
            return;
          }
          // headContentType.startsWith('video/') ─ could be real video OR
          // Cloudinary audio stored under the video resource_type.
          // Fall through to Step 2 to disambiguate.
        }
      } catch (error) {
        console.warn('HEAD request failed, falling back to audio probe:', error);
      }

      // ── Step 2: Disambiguate Cloudinary video/* that might be audio ──
      // Cloudinary returns Content-Type: video/mp4 for audio files uploaded
      // with resource_type "video".  Try to load the URL as an Audio.Sound;
      // if it succeeds it is almost certainly audio.
      const looksLikeCloudinary = uri.toLowerCase().includes('cloudinary.com');
      const headSaysVideo = headContentType?.startsWith('video/') ?? false;
      const shouldProbeAudio = looksLikeCloudinary || headSaysVideo || headContentType === null;

      if (shouldProbeAudio && !audioProbeFailed) {
        const probeSound = new Audio.Sound();
        try {
          await probeSound.loadAsync({ uri }, { shouldPlay: false });
          if (!isMounted) {
            await probeSound.unloadAsync();
            return;
          }
          // If we get here, the URL is playable as audio
          audioRef.current = probeSound;
          probeSound.setOnPlaybackStatusUpdate(status => {
            if (!status.isLoaded || !isMounted) return;
            handleAudioStatusUpdate(status);
          });
          setMediaType('audio');
          return;
        } catch {
          // Not audio — unload and treat as video
          await probeSound.unloadAsync().catch(() => undefined);
        }
      }

      // ── Step 3: Default to video if HEAD said so, else unknown ───────
      if (isMounted) {
        if (headSaysVideo) {
          setMediaType('video');
        } else {
          setAudioProbeFailed(true);
        }
      }
    };

    resolveMediaType();

    return () => {
      isMounted = false;
    };
  }, [mediaType, uri, audioProbeFailed]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsVideoPlaying(status.isPlaying);
  };

  const toggleVideoPlayback = async () => {
    const player = videoRef.current;
    if (!player) return;
    const status = await player.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await player.pauseAsync();
    } else {
      await player.playAsync();
    }
  };

  const handleAudioStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsAudioPlaying(status.isPlaying);
    if (typeof status.durationMillis === 'number' && status.durationMillis > 0) {
      const nextProgress =
        (status.positionMillis ?? 0) / Math.max(status.durationMillis, 1);
      setAudioProgress(Math.min(Math.max(nextProgress, 0), 1));
    } else {
      setAudioProgress(0);
    }
    if (status.didJustFinish) {
      audioRef.current
        ?.setPositionAsync(0)
        .catch(error => console.warn('Failed to reset audio position:', error));
    }
  };

  useEffect(() => {
    if (mediaType !== 'audio') return undefined;
    let isMounted = true;

    const loadAudio = async () => {
      let sound = audioRef.current;
      if (!sound) {
        sound = new Audio.Sound();
        audioRef.current = sound;
      }
      try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) {
          await sound.loadAsync({ uri }, { shouldPlay: false });
        }
        sound.setOnPlaybackStatusUpdate(status => {
          if (!status.isLoaded || !isMounted) return;
          handleAudioStatusUpdate(status);
        });
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.setOnPlaybackStatusUpdate(null);
        audioRef.current.unloadAsync().catch(() => undefined);
        audioRef.current = null;
      }
      setIsAudioPlaying(false);
      setAudioProgress(0);
    };
  }, [mediaType, uri]);

  useEffect(() => {
    const sound = audioRef.current;
    if (!sound) return;
    sound
      .setRateAsync(AUDIO_RATES[audioRateIndex], true)
      .catch(error => console.warn('Failed to update audio speed:', error));
  }, [audioRateIndex]);

  const toggleAudioPlayback = async () => {
    const sound = audioRef.current;
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
    } else {
      if (
        status.durationMillis &&
        status.positionMillis !== null &&
        status.positionMillis !== undefined &&
        status.positionMillis >= status.durationMillis
      ) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
    }
  };

  const cycleAudioSpeed = () => {
    setAudioRateIndex(current => (current + 1) % AUDIO_RATES.length);
  };

  if (mediaType === 'image') {
    return <Image source={{ uri }} style={mediaStyle} resizeMode="cover" />;
  }

  if (mediaType === 'video') {
    return (
      <View style={[styles.videoContainer, mediaStyle as StyleProp<ViewStyle>]}>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          isLooping
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        <TouchableOpacity
          style={[styles.videoOverlay, isVideoPlaying && styles.videoOverlayPlaying]}
          onPress={toggleVideoPlayback}
          activeOpacity={0.8}
        >
          {!isVideoPlaying && <Ionicons name="play" size={48} color="#ffffff" />}
        </TouchableOpacity>
      </View>
    );
  }

  if (mediaType === 'audio') {
    return (
      <View style={[styles.audioContainer, mediaStyle as StyleProp<ViewStyle>]}>
        <View style={styles.audioInfo}>
          <Ionicons name="musical-notes" size={28} color="#007AFF" />
          <View style={styles.audioProgressTrack}>
            <View
              style={[styles.audioProgressFill, { width: `${audioProgress * 100}%` }]}
            />
          </View>
        </View>
        <View style={styles.audioControls}>
          <TouchableOpacity style={styles.audioControlButton} onPress={toggleAudioPlayback}>
            <Ionicons
              name={isAudioPlaying ? 'pause' : 'play'}
              size={18}
              color="#1f2937"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.audioControlButton} onPress={cycleAudioSpeed}>
            <Text style={styles.audioSpeedText}>{AUDIO_RATES[audioRateIndex]}x</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const iconName = UNKNOWN_MEDIA_ICON;
  const title = UNKNOWN_MEDIA_TITLE;

  const handlePress = async () => {
    try {
      await Linking.openURL(uri);
    } catch (error) {
      console.error('Failed to open media URL:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.nonImageMediaContainer, mediaStyle as StyleProp<ViewStyle>]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons name={iconName} size={28} color="#007AFF" />
      <Text style={styles.nonImageMediaTitle}>{title}</Text>
      <Text style={styles.nonImageMediaAction}>Tap to open</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  videoOverlayPlaying: {
    backgroundColor: 'transparent',
  },
  nonImageMediaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#dbe3ed',
    borderRadius: 12,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#dbe3ed',
    borderRadius: 12,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  audioProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioSpeedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  nonImageMediaTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  nonImageMediaAction: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
});
