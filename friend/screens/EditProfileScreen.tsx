import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import authService, { ProfileData } from '../services/authService';

// MIME type lookup for supported image extensions
// Supporting common web-friendly formats only (JPEG, PNG, GIF, WebP)
const IMAGE_MIME_TYPES: { [key: string]: string } = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update state when user data changes (only on first load)
  useEffect(() => {
    console.log('useEffect triggered, user:', user ? 'exists' : 'null', 'isInitialized:', isInitialized);
    if (user && !isInitialized) {
      console.log('Initializing form with user data:', {
        name: user.name,
        profession: user.profession,
        organization: user.organization,
        location: user.location,
        hasProfilePicture: !!user.profilePicture,
      });
      setName(user.name || '');
      setProfession(user.profession || '');
      setOrganization(user.organization || '');
      setLocation(user.location || '');
      setProfilePicture(user.profilePicture || '');
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  const pickImage = async () => {
    try {
      // Show action sheet to choose between camera and library
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
              if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please grant camera permission to take photos.');
                return;
              }
              await launchImagePicker(ImagePicker.launchCameraAsync);
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please grant media library permission to select photos.');
                return;
              }
              await launchImagePicker(ImagePicker.launchImageLibraryAsync);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const launchImagePicker = async (
    pickerFunction: typeof ImagePicker.launchImageLibraryAsync | typeof ImagePicker.launchCameraAsync
  ) => {
    try {
      const result = await pickerFunction({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Convert to base64 data URL
        if (asset.base64) {
          let mimeType = 'image/jpeg'; // default
          if (asset.uri) {
            const uriLower = asset.uri.toLowerCase();
            // Check extensions in order of specificity (longer first)
            const extensions = ['.jpeg', '.webp', '.jpg', '.png', '.gif'];
            const extension = extensions.find(ext => uriLower.endsWith(ext));
            if (extension) {
              mimeType = IMAGE_MIME_TYPES[extension];
            }
          }
          
          const base64Image = `data:${mimeType};base64,${asset.base64}`;
          setProfilePicture(base64Image);
        }
      }
    } catch (error) {
      console.error('Error in image picker:', error);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const handleSave = async () => {
    console.log('handleSave called', { profession, organization, location, name, hasProfilePicture: !!profilePicture });
    
    if (!profession || !organization || !location) {
      Alert.alert('Error', 'Please fill in all required fields (Profession, Organization, Location)');
      return;
    }

    setLoading(true);
    try {
      const updateData: ProfileData = { 
        profession, 
        organization, 
        location,
        ...(name?.trim() && { name: name.trim() }),
        ...(profilePicture && { profilePicture }),
      };
      
      console.log('Sending update with data:', { 
        ...updateData, 
        profilePicture: updateData.profilePicture ? 'base64 data present' : 'none' 
      });
      
      await authService.updateProfile(updateData);
      console.log('Profile update successful');
      
      await refreshUser();
      console.log('User data refreshed');
      
      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to update profile');
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
            <TouchableOpacity style={styles.avatarLarge} onPress={pickImage}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profileImage} />
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
            <Text style={styles.hintSmall}>Username and email cannot be changed</Text>
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
    marginBottom: 4,
  },
  hintSmall: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
