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
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import authService from '../services/authService';
import { useAppTheme } from '../constants/AppTheme';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [profilePictureBase64, setProfilePictureBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useAppTheme();

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select a profile picture.');
      return;
    }

    // Launch image picker with base64 option
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true, // Request base64 encoding directly
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setProfilePicture(asset.uri);
      
      // Store base64 with proper data URI prefix
      if (asset.base64) {
        const mimeType = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        setProfilePictureBase64(`data:${mimeType};base64,${asset.base64}`);
      }
    }
  };

  const handleSave = async () => {
    if (!profession || !organization || !location) {
      Alert.alert('Error', 'Please fill in all required fields (Profession, Organization, Location)');
      return;
    }

    setLoading(true);
    try {
      let imageToSend = undefined;
      
      // If we have a new base64 image, use it
      // Otherwise, if there's an existing URL, keep it
      if (profilePictureBase64) {
        imageToSend = profilePictureBase64;
      } else if (profilePicture && profilePicture.startsWith('http')) {
        imageToSend = profilePicture;
      }
      
      await authService.updateProfile({ 
        name: name || undefined,
        profession, 
        organization, 
        location,
        profilePicture: imageToSend
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
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={[styles.avatarLarge, { backgroundColor: colors.accent }]}
              onPress={pickImage}
              disabled={loading}
            >
              {profilePicture ? (
                <Image 
                  source={{ uri: profilePicture }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={[styles.avatarTextLarge, { color: colors.textInverse }]}>
                  {name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
                <IconSymbol name="camera.fill" size={16} color={colors.textInverse} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.username, { color: colors.textPrimary }]}>{user?.username}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>Tap to change profile picture</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Display Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="Your full name"
                placeholderTextColor={colors.inputPlaceholder}
                value={name}
                onChangeText={setName}
                editable={!loading}
                autoCapitalize="words"
              />
              <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>This is how others will see your name</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Profession *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="e.g. Software Engineer"
                placeholderTextColor={colors.inputPlaceholder}
                value={profession}
                onChangeText={setProfession}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Organization *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="e.g. Tech Company Inc."
                placeholderTextColor={colors.inputPlaceholder}
                value={organization}
                onChangeText={setOrganization}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Location *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                placeholder="e.g. San Francisco, CA"
                placeholderTextColor={colors.inputPlaceholder}
                value={location}
                onChangeText={setLocation}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.accent }]}>Cancel</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarTextLarge: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
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
    marginBottom: 8,
  },
  input: {
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  fieldHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
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
    fontSize: 16,
    fontWeight: '600',
  },
});
