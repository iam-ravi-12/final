import React from 'react';
import {
  Image,
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { inferMediaType } from '../utils/media';

interface PostMediaAttachmentProps {
  uri: string;
  mediaStyle: StyleProp<ImageStyle | ViewStyle>;
}

export default function PostMediaAttachment({ uri, mediaStyle }: PostMediaAttachmentProps) {
  const mediaType = inferMediaType(uri);

  if (mediaType === 'image' || mediaType === 'unknown') {
    return <Image source={{ uri }} style={mediaStyle} resizeMode="cover" />;
  }

  if (mediaType === 'video') {
    return (
      <Video
        source={{ uri }}
        style={mediaStyle as StyleProp<ViewStyle>}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
      />
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
