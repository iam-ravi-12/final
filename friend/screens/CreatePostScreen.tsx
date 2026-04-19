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

type SelectedMedia = {
  uri: string;
  payload: string; // Firebase Storage URL returned after upload
};

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [isHelpSection, setIsHelpSection] = useState(false);
  const [showInHome, setShowInHome] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant media library permission to upload files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
          const url = await uploadMedia(asset.uri, mimeType, 'posts');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
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
          const url = await uploadMedia(asset.uri, mimeType, 'posts');
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
          const url = await uploadMedia(asset.uri, mimeType, 'posts');
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

        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={showMediaPickerOptions}
          disabled={loading || uploadingMedia}
        >
          {uploadingMedia ? (
            <>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.addPhotoText}>{uploadStatus || 'Uploading…'}</Text>
            </>
          ) : (
            <>
              <Ionicons name="attach-outline" size={24} color="#007AFF" />
              <Text style={styles.addPhotoText}>
                {selectedMedia ? 'Change Media' : 'Add Photo / Video / Audio'}
              </Text>
            </>
          )}
        </TouchableOpacity>

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
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
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
