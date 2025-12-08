import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import authService from '../services/authService';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profession || !organization || !location) {
      Alert.alert('Error', 'Please fill in all required fields (Profession, Organization, Location)');
      return;
    }

    setLoading(true);
    try {
      await authService.updateProfile({ 
        profession, 
        organization, 
        location,
        profilePicture: profilePicture || undefined
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity style={styles.avatarLarge}>
              {profilePicture ? (
                <Text style={styles.avatarTextLarge}>🖼️</Text>
              ) : (
                <Text style={styles.avatarTextLarge}>
                  {name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
              <View style={styles.editBadge}>
                <IconSymbol name="camera.fill" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.hint}>Tap camera icon to change picture</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                value={name}
                onChangeText={setName}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Profile Picture URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/photo.jpg"
                value={profilePicture}
                onChangeText={setProfilePicture}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={styles.fieldHint}>Enter a URL to your profile picture</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Profession *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Software Engineer"
                value={profession}
                onChangeText={setProfession}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Organization *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tech Company Inc."
                value={organization}
                onChangeText={setOrganization}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChangeText={setLocation}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fieldHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
