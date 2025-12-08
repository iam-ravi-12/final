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
} from 'react-native';
import { router } from 'expo-router';
import postService from '../services/postService';

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [isHelpSection, setIsHelpSection] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter post content');
      return;
    }

    setLoading(true);
    try {
      await postService.createPost({ content, isHelpSection });
      Alert.alert('Success', 'Post created successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <Text
            style={[
              styles.postButton,
              loading && styles.postButtonDisabled,
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
