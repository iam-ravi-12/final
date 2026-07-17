import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import { AdminReport } from '../services/adminService';
import { formatRelativeDate } from '@/utils/helpers';

interface ReportCardProps {
  report: AdminReport;
  onResolve?: (id: number, notes?: string) => Promise<void>;
  onDismiss?: (id: number, notes?: string) => Promise<void>;
}

export default function ReportCard({
  report,
  onResolve,
  onDismiss,
}: ReportCardProps) {
  const { colors } = useAppTheme();
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'resolve' | 'dismiss' | null>(null);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: AdminReport['status']) => {
    switch (status) {
      case 'PENDING':
        return colors.warning;
      case 'REVIEWED':
        return colors.accent;
      case 'RESOLVED':
        return colors.success;
      case 'DISMISSED':
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  const getReportedEntityDetails = () => {
    if (report.reportedCommunityPostId) {
      return {
        type: 'Community Post',
        icon: 'chatbox-outline',
        details: report.reportedCommunityPostContent || `Community Post ID: ${report.reportedCommunityPostId}`,
      };
    }
    if (report.reportedPostId) {
      return {
        type: 'Post',
        icon: 'document-text-outline',
        details: report.reportedPostContent || `Post ID: ${report.reportedPostId}`,
      };
    }
    if (report.reportedCommunityId) {
      return {
        type: 'Community',
        icon: 'people-outline',
        details: report.reportedCommunityName || `Community ID: ${report.reportedCommunityId}`,
      };
    }
    if (report.reportedUserId) {
      return {
        type: 'User',
        icon: 'person-outline',
        details: report.reportedUserName || `User ID: ${report.reportedUserId}`,
      };
    }
    return null;
  };

  const handleAction = async (type: 'resolve' | 'dismiss') => {
    if (!showNotesInput || actionType !== type) {
      setActionType(type);
      setShowNotesInput(true);
      return;
    }

    try {
      setLoading(true);
      if (type === 'resolve' && onResolve) {
        await onResolve(report.id, adminNotes.trim() || undefined);
      } else if (type === 'dismiss' && onDismiss) {
        await onDismiss(report.id, adminNotes.trim() || undefined);
      }
      setShowNotesInput(false);
      setAdminNotes('');
      setActionType(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || `Failed to ${type} report`);
    } finally {
      setLoading(false);
    }
  };

  const entity = getReportedEntityDetails();

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <View style={styles.reporterContainer}>
          <Text style={[styles.reporterLabel, { color: colors.textSecondary }]}>Reporter</Text>
          <Text style={[styles.reporterName, { color: colors.textPrimary }]}>{report.reporterName}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(report.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>{report.status}</Text>
        </View>
      </View>

      {entity && (
        <View style={[styles.entityContainer, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
          <View style={styles.entityHeader}>
            <Ionicons name={entity.icon as any} size={16} color={colors.accent} style={styles.entityIcon} />
            <Text style={[styles.entityType, { color: colors.accent }]}>Reported {entity.type}</Text>
          </View>
          <Text style={[styles.entityDetails, { color: colors.textPrimary }]} numberOfLines={3}>
            {entity.details}
          </Text>
        </View>
      )}

      <View style={styles.reasonContainer}>
        <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>Reason for Report</Text>
        <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{report.reason}</Text>
      </View>

      {/* Admin Notes (shown if resolved/dismissed) */}
      {report.adminNotes && (
        <View style={[styles.adminNotesContainer, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.reasonLabel, { color: colors.textSecondary }]}>Admin Notes</Text>
          <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{report.adminNotes}</Text>
        </View>
      )}

      {/* Notes Input */}
      {showNotesInput && (
        <View style={styles.notesInputContainer}>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.surfaceBorder,
              },
            ]}
            placeholder="Add notes (optional)..."
            placeholderTextColor={colors.textTertiary}
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            maxLength={500}
          />
        </View>
      )}

      {/* Action Buttons — only for PENDING reports */}
      {report.status === 'PENDING' && (onResolve || onDismiss) && (
        <View style={styles.actionsContainer}>
          {onResolve && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.success },
                actionType === 'resolve' && showNotesInput && styles.actionButtonActive,
              ]}
              onPress={() => handleAction('resolve')}
              disabled={loading}
            >
              {loading && actionType === 'resolve' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {actionType === 'resolve' && showNotesInput ? 'Confirm Resolve' : 'Resolve'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {onDismiss && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.textTertiary },
                actionType === 'dismiss' && showNotesInput && styles.actionButtonActive,
              ]}
              onPress={() => handleAction('dismiss')}
              disabled={loading}
            >
              {loading && actionType === 'dismiss' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {actionType === 'dismiss' && showNotesInput ? 'Confirm Dismiss' : 'Dismiss'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {showNotesInput && (
            <TouchableOpacity
              style={styles.cancelNotesButton}
              onPress={() => {
                setShowNotesInput(false);
                setAdminNotes('');
                setActionType(null);
              }}
            >
              <Text style={[styles.cancelNotesText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
        <Text style={[styles.date, { color: colors.textTertiary }]}>
          Reported {formatRelativeDate(report.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reporterContainer: {
    flex: 1,
    marginRight: 8,
  },
  reporterLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  reporterName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  entityContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  entityIcon: {
    marginRight: 6,
  },
  entityType: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  entityDetails: {
    fontSize: 13,
    lineHeight: 18,
  },
  reasonContainer: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  adminNotesContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  notesInputContainer: {
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 60,
    maxHeight: 100,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionButtonActive: {
    opacity: 0.9,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelNotesButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cancelNotesText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 11,
  },
});
