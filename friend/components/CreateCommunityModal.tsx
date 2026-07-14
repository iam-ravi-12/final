import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import communityService from '../services/communityService';
import { MAX_COMMUNITY_NAME_LENGTH, MAX_COMMUNITY_DESCRIPTION_LENGTH } from '../constants/config';
import { useAppTheme } from '../constants/AppTheme';

interface CreateCommunityModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCommunityModal({
  visible,
  onClose,
  onSuccess,
}: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors, isDark, typography } = useAppTheme();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a community name');
      return;
    }

    try {
      setLoading(true);
      await communityService.createCommunity({
        name: name.trim(),
        description: description.trim(),
        isPrivate,
      });
      Alert.alert('Success', 'Community created successfully!');
      setName('');
      setDescription('');
      setIsPrivate(false);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating community:', error);
      Alert.alert('Error', 'Failed to create community. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
              <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.fontFamilyRounded }]}>
                Create Community
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Community Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter community name"
                  placeholderTextColor={colors.inputPlaceholder}
                  maxLength={MAX_COMMUNITY_NAME_LENGTH}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your community"
                  placeholderTextColor={colors.inputPlaceholder}
                  multiline
                  numberOfLines={4}
                  maxLength={MAX_COMMUNITY_DESCRIPTION_LENGTH}
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsPrivate(!isPrivate)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  {
                    borderColor: isPrivate ? colors.accent : colors.inputBorder,
                    backgroundColor: isPrivate ? colors.accent : 'transparent',
                  }
                ]}>
                  {isPrivate && <Ionicons name="checkmark" size={18} color={colors.textInverse} />}
                </View>
                <View style={styles.checkboxLabel}>
                  <Text style={[styles.checkboxText, { color: colors.textPrimary }]}>Private Community</Text>
                  <Text style={[styles.checkboxSubtext, { color: colors.textSecondary }]}>
                    Only invited members can join
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.inputBg }]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, { backgroundColor: colors.accent }, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>
                  {loading ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {},
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

