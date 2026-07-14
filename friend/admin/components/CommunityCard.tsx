import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import { AdminCommunity } from '../services/adminService';
import { formatMemberCount, formatRelativeDate } from '@/utils/helpers';

interface CommunityCardProps {
  community: AdminCommunity;
  onDelete: () => void;
}

export default function CommunityCard({
  community,
  onDelete,
}: CommunityCardProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        {community.profilePicture ? (
          <Image source={{ uri: community.profilePicture }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
            <Ionicons name="people-circle" size={32} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {community.name}
          </Text>
          <Text style={[styles.members, { color: colors.textSecondary }]}>
            {formatMemberCount(community.memberCount || 0)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: 'rgba(229, 83, 75, 0.1)' }]}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {community.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {community.description}
        </Text>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
        <Text style={[styles.creator, { color: colors.textTertiary }]} numberOfLines={1}>
          Created by @{community.adminUsername}
        </Text>
        <Text style={[styles.date, { color: colors.textTertiary }]}>
          {formatRelativeDate(community.createdAt)}
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
    alignItems: 'center',
    marginBottom: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  members: {
    fontSize: 13,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  creator: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 11,
  },
});
