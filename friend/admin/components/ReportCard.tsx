import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import { AdminReport } from '../services/adminService';
import { formatRelativeDate } from '@/utils/helpers';

interface ReportCardProps {
  report: AdminReport;
}

export default function ReportCard({
  report,
}: ReportCardProps) {
  const { colors } = useAppTheme();

  const getStatusColor = (status: AdminReport['status']) => {
    switch (status) {
      case 'PENDING':
        return colors.warning;
      case 'REVIEWED':
        return colors.accent;
      case 'RESOLVED':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getReportedEntityDetails = () => {
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
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 11,
  },
});
