import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import { AdminUser } from '../services/adminService';
import { formatRelativeDate } from '@/utils/helpers';

interface UserCardProps {
  user: AdminUser;
  onViewDetails: () => void;
  onBanUnban: () => void;
  onDelete: () => void;
}

export default function UserCard({
  user,
  onViewDetails,
  onBanUnban,
  onDelete,
}: UserCardProps) {
  const { colors } = useAppTheme();

  const getStatusColor = (status: AdminUser['status']) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'BANNED':
        return colors.danger;
      case 'DELETED':
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        {user.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background }]}>
            <Ionicons name="person" size={24} color={colors.textSecondary} />
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {user.name || user.username}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
            {user.email}
          </Text>
          {user.profession ? (
            <Text style={[styles.profession, { color: colors.textSecondary }]} numberOfLines={1}>
              {user.profession}
            </Text>
          ) : null}
        </View>

        <View style={styles.badges}>
          <View style={[
            styles.badge, 
            { backgroundColor: user.role === 'ADMIN' ? 'rgba(167, 139, 250, 0.15)' : colors.background }
          ]}>
            <Text style={[
              styles.badgeText, 
              { color: user.role === 'ADMIN' ? '#A78BFA' : colors.textSecondary }
            ]}>
              {user.role}
            </Text>
          </View>
          <View style={[
            styles.badge, 
            { backgroundColor: `${getStatusColor(user.status)}15` }
          ]}>
            <Text style={[
              styles.badgeText, 
              { color: getStatusColor(user.status) }
            ]}>
              {user.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
        <Text style={[styles.date, { color: colors.textTertiary }]}>
          Joined {formatRelativeDate(user.createdAt)}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            onPress={onViewDetails}
          >
            <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {user.role !== 'ADMIN' && (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  { backgroundColor: user.status === 'BANNED' ? 'rgba(63, 185, 80, 0.1)' : 'rgba(229, 83, 75, 0.1)' }
                ]}
                onPress={onBanUnban}
              >
                <Ionicons 
                  name={user.status === 'BANNED' ? 'checkmark-circle-outline' : 'ban-outline'} 
                  size={16} 
                  color={user.status === 'BANNED' ? colors.success : colors.danger} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: 'rgba(229, 83, 75, 0.1)' }]}
                onPress={onDelete}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
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
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    marginBottom: 2,
  },
  profession: {
    fontSize: 12,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  date: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
