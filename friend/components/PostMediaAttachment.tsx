import React, { useRef, useState } from 'react';
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
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { inferMediaType } from '../utils/media';

interface PostMediaAttachmentProps {
  uri: string;
  mediaStyle: StyleProp<ImageStyle | ViewStyle>;
}

export default function PostMediaAttachment({ uri, mediaStyle }: PostMediaAttachmentProps) {
  const mediaType = inferMediaType(uri);
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
  };

  const togglePlayback = async () => {
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

  if (mediaType === 'image' || mediaType === 'unknown') {
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
          style={[styles.videoOverlay, isPlaying && styles.videoOverlayPlaying]}
          onPress={togglePlayback}
          activeOpacity={0.8}
        >
          {!isPlaying && <Ionicons name="play" size={48} color="#ffffff" />}
        </TouchableOpacity>
      </View>
    );
  }

  const iconName = 'musical-notes';
  const title = 'Audio attachment';

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
