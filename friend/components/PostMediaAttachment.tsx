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
}

const AUDIO_RATES = [1, 1.5, 2];
const UNKNOWN_MEDIA_ICON = 'attach-outline';
const UNKNOWN_MEDIA_TITLE = 'Attachment';

export default function PostMediaAttachment({ uri, mediaStyle }: PostMediaAttachmentProps) {
  const initialMediaType = inferMediaType(uri);
  const videoRef = useRef<Video>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const [mediaType, setMediaType] = useState<PostMediaType>(initialMediaType);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioRateIndex, setAudioRateIndex] = useState(0);

  useEffect(() => {
    setMediaType(initialMediaType);
  }, [initialMediaType, uri]);

  useEffect(() => {
    if (mediaType !== 'unknown' || !uri) return;
    let isMounted = true;

    const resolveMediaType = async () => {
      try {
        const response = await fetch(uri, { method: 'HEAD' });
        const contentType = response.headers.get('content-type')?.toLowerCase();
        if (!contentType) return;
        let resolved: PostMediaType | null = null;
        if (contentType.startsWith('image/')) resolved = 'image';
        if (contentType.startsWith('video/')) resolved = 'video';
        if (contentType.startsWith('audio/')) resolved = 'audio';
        if (resolved && isMounted) {
          setMediaType(resolved);
        }
      } catch (error) {
        console.warn('Unable to resolve media type:', error);
      }
    };

    resolveMediaType();

    return () => {
      isMounted = false;
    };
  }, [mediaType, uri]);

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

  useEffect(() => {
    if (mediaType !== 'audio') return undefined;
    let isMounted = true;

    const loadAudio = async () => {
      const sound = new Audio.Sound();
      audioRef.current = sound;
      try {
        await sound.loadAsync({ uri }, { shouldPlay: false });
        sound.setOnPlaybackStatusUpdate(status => {
          if (!status.isLoaded || !isMounted) return;
          setIsAudioPlaying(status.isPlaying);
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
          <Text style={styles.audioTitle}>Audio attachment</Text>
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
  audioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
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
