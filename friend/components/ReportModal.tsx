import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';

const REPORT_REASONS = [
  'Spam',
  'Harassment or bullying',
  'Inappropriate content',
  'Misinformation',
  'Hate speech',
  'Violence or threats',
  'Other',
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<any>;
  entityType: 'post' | 'community post' | 'community' | 'user';
}

export default function ReportModal({ visible, onClose, onSubmit, entityType }: ReportModalProps) {
  const { colors } = useAppTheme();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) {
      Alert.alert('Error', 'Please select or enter a reason for reporting');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(reason);
      Alert.alert('Report Submitted', 'Thank you for your report. Our team will review it shortly.');
      resetAndClose();
    } catch (error: any) {
      const message = error?.response?.data || error?.message || 'Failed to submit report';
      Alert.alert('Error', typeof message === 'string' ? message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={resetAndClose}>
        <Pressable style={[styles.container, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="flag" size={22} color={colors.danger} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Report {entityType}
              </Text>
            </View>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Why are you reporting this {entityType}?
          </Text>

          {/* Reason Options */}
          <View style={styles.reasonList}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  {
                    backgroundColor: selectedReason === reason
                      ? `${colors.accent}15`
                      : colors.inputBg,
                    borderColor: selectedReason === reason
                      ? colors.accent
                      : colors.surfaceBorder,
                  },
                ]}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radio,
                  {
                    borderColor: selectedReason === reason ? colors.accent : colors.textTertiary,
                  },
                ]}>
                  {selectedReason === reason && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    { color: selectedReason === reason ? colors.accent : colors.textPrimary },
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom reason input */}
          {selectedReason === 'Other' && (
            <TextInput
              style={[
                styles.customInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                  borderColor: colors.surfaceBorder,
                },
              ]}
              placeholder="Please describe the issue..."
              placeholderTextColor={colors.inputPlaceholder}
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              maxLength={500}
            />
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.danger },
              (!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="flag" size={18} color={colors.textInverse} />
                <Text style={[styles.submitButtonText, { color: colors.textInverse }]}>
                  Submit Report
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  reasonList: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  customInput: {
    marginTop: 12,
    minHeight: 80,
    maxHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
