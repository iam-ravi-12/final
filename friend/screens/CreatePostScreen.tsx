import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import postService from '../services/postService';
import PostMediaAttachment from '../components/PostMediaAttachment';
import { getMimeTypeFromUri } from '../utils/media';
import { uploadMedia } from '../services/mediaUploadService';
import CameraModal from '../components/CameraModal';
import AudioRecorderModal from '../components/AudioRecorderModal';

type SelectedMedia = {
  uri: string;
  payload: string; // Cloudinary URL returned after upload
};

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [isHelpSection, setIsHelpSection] = useState(false);
  const [showInHome, setShowInHome] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [audioRecorderVisible, setAudioRecorderVisible] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant media library permission to upload files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        // Compress images to ~60 % quality to reduce upload size
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || getMimeTypeFromUri(asset.uri) || 'image/jpeg';
        setUploadingMedia(true);
        setUploadStatus('Uploading photo…');
        try {
          const url = await uploadMedia(asset.uri, mimeType, 'posts', setUploadStatus);
          setSelectedMedia({ uri: asset.uri, payload: url });
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          Alert.alert('Upload Failed', 'Could not upload the photo. Please try again.');
        } finally {
          setUploadingMedia(false);
          setUploadStatus('');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open photo picker. Please try again.');
      setUploadingMedia(false);
      setUploadStatus('');
    }
  };

  const pickVideo = async () => {
    // iOS/Android cannot show two native modal sheets simultaneously.
    // The Alert sheet needs ~200 ms to fully animate out before the next
    // native picker (ImagePicker) can be presented without throwing an error.
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant media library permission to upload files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        // Compress video to ~50 % quality to reduce upload size
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || getMimeTypeFromUri(asset.uri) || 'video/mp4';
        setUploadingMedia(true);
        setUploadStatus('Uploading video… this may take a moment');
        try {
          const url = await uploadMedia(asset.uri, mimeType, 'posts', setUploadStatus);
          setSelectedMedia({ uri: asset.uri, payload: url });
        } catch (uploadErr) {
          console.error('Error uploading video:', uploadErr);
          Alert.alert('Upload Failed', 'Could not upload the video. Please try again or choose a shorter clip.');
        } finally {
          setUploadingMedia(false);
          setUploadStatus('');
        }
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to open video picker. Please try again.');
    }
  };

  const pickAudio = async () => {
    // iOS/Android cannot show two native modal sheets simultaneously.
    // The Alert sheet needs ~200 ms to fully animate out before the next
    // native picker (DocumentPicker) can be presented without throwing an error.
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || getMimeTypeFromUri(asset.uri) || 'audio/mpeg';
        setUploadingMedia(true);
        setUploadStatus('Uploading audio…');
        try {
          const url = await uploadMedia(asset.uri, mimeType, 'posts', setUploadStatus);
          setSelectedMedia({ uri: asset.uri, payload: url });
        } catch (uploadErr) {
          console.error('Error uploading audio:', uploadErr);
          Alert.alert('Upload Failed', 'Could not upload the audio file. Please try again.');
        } finally {
          setUploadingMedia(false);
          setUploadStatus('');
        }
      }
    } catch (error) {
      console.error('Error picking audio:', error);
      Alert.alert('Error', 'Failed to open audio picker. Please try again.');
    }
  };

  const showMediaPickerOptions = () => {
    Alert.alert('Add Media', 'Choose what you want to add', [
      { text: 'Photo', onPress: pickImage },
      { text: 'Video', onPress: pickVideo },
      { text: 'Audio', onPress: pickAudio },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  /** Called when the user captures a photo/video via the in-app camera */
  const handleCameraCapture = async (uri: string, mimeType: string) => {
    setUploadingMedia(true);
    const label = mimeType.startsWith('video') ? 'video' : 'photo';
    setUploadStatus(`Uploading ${label}…`);
    try {
      const url = await uploadMedia(uri, mimeType, 'posts', setUploadStatus);
      setSelectedMedia({ uri, payload: url });
    } catch (uploadErr) {
      console.error('Error uploading captured media:', uploadErr);
      Alert.alert('Upload Failed', `Could not upload the ${label}. Please try again.`);
    } finally {
      setUploadingMedia(false);
      setUploadStatus('');
    }
  };

  /** Called when the user records audio via the in-app recorder */
  const handleAudioCapture = async (uri: string, mimeType: string) => {
    setUploadingMedia(true);
    setUploadStatus('Uploading audio recording…');
    try {
      const url = await uploadMedia(uri, mimeType, 'posts', setUploadStatus);
      setSelectedMedia({ uri, payload: url });
    } catch (uploadErr) {
      console.error('Error uploading audio recording:', uploadErr);
      Alert.alert('Upload Failed', 'Could not upload the audio recording. Please try again.');
    } finally {
      setUploadingMedia(false);
      setUploadStatus('');
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter post content');
      return;
    }

    setLoading(true);
    try {
      const postData: any = {
        content,
        isHelpSection,
        showInHome,
      };
      
      if (selectedMedia?.payload) {
        postData.mediaUrls = [selectedMedia.payload];
      }
      
      await postService.createPost(postData);
      Alert.alert('Success', 'Post created successfully!');
      setContent('');
      setSelectedMedia(null);
      setIsHelpSection(false);
      setShowInHome(true);
      router.back();
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading || uploadingMedia}>
            <Text
              style={[
                styles.postButton,
                (loading || uploadingMedia) && styles.postButtonDisabled,
              ]}
            >
              {loading ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.textArea}
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
          editable={!loading}
        />

        {selectedMedia?.uri && (
          <View style={styles.imageContainer}>
            <PostMediaAttachment uri={selectedMedia.uri} mediaStyle={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={removeMedia}
              disabled={loading}
            >
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Media action row */}
        <View style={styles.mediaActionsRow}>
          {/* Gallery / file picker */}
          <TouchableOpacity
            style={[styles.mediaActionButton, (loading || uploadingMedia) && styles.mediaActionDisabled]}
            onPress={showMediaPickerOptions}
            disabled={loading || uploadingMedia}
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="attach-outline" size={22} color="#007AFF" />
            )}
            <Text style={styles.mediaActionText} numberOfLines={1}>
              {uploadingMedia
                ? (uploadStatus || 'Uploading…')
                : selectedMedia
                ? 'Change Media'
                : 'Gallery'}
            </Text>
          </TouchableOpacity>

          {/* Camera capture button */}
          <TouchableOpacity
            style={[styles.cameraActionButton, (loading || uploadingMedia) && styles.mediaActionDisabled]}
            onPress={() => setCameraVisible(true)}
            disabled={loading || uploadingMedia}
          >
            <Ionicons name="camera-outline" size={22} color="#fff" />
            <Text style={styles.cameraActionText}>Camera</Text>
          </TouchableOpacity>

          {/* Audio record button */}
          <TouchableOpacity
            style={[styles.audioActionButton, (loading || uploadingMedia) && styles.mediaActionDisabled]}
            onPress={() => setAudioRecorderVisible(true)}
            disabled={loading || uploadingMedia}
          >
            <Ionicons name="mic-outline" size={22} color="#fff" />
            <Text style={styles.audioActionText}>Record</Text>
          </TouchableOpacity>
        </View>

        {/* In-app camera modal */}
        <CameraModal
          visible={cameraVisible}
          onClose={() => setCameraVisible(false)}
          onCapture={handleCameraCapture}
        />

        {/* In-app audio recorder modal */}
        <AudioRecorderModal
          visible={audioRecorderVisible}
          onClose={() => setAudioRecorderVisible(false)}
          onCapture={handleAudioCapture}
        />

        <View style={styles.option}>
          <View>
            <Text style={styles.optionLabel}>Mark as Help Request</Text>
            <Text style={styles.optionDescription}>
              Post this in the Help section
            </Text>
          </View>
          <Switch
            value={isHelpSection}
            onValueChange={setIsHelpSection}
            disabled={loading}
          />
        </View>

        <View style={styles.option}>
          <View>
            <Text style={styles.optionLabel}>Show in Home Page</Text>
            <Text style={styles.optionDescription}>
              Display this post on the home feed
            </Text>
          </View>
          <Switch
            value={showInHome}
            onValueChange={setShowInHome}
            disabled={loading}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  postButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  textArea: {
    backgroundColor: '#fff',
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 14,
  },
  // ── Media action row ────────────────────────────────────────────
  mediaActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 12,
    gap: 10,
  },
  mediaActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaActionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    flexShrink: 1,
  },
  cameraActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraActionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  audioActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  audioActionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  mediaActionDisabled: {
    opacity: 0.5,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
