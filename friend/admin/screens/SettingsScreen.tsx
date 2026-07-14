import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import { useAuth } from '@/contexts/AuthContext';
import AdminHeader from '../components/AdminHeader';

export default function SettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AdminHeader title="Settings" subtitle="Manage your preferences and session" showLogout={false} />

      <View style={styles.content}>
        {/* Admin Profile Details */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.profileRow}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background }]}>
                <Ionicons name="person" size={32} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name || 'Administrator'}</Text>
              <Text style={[styles.role, { color: colors.accent }]}>System Administrator</Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* System Settings & Theme info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Information</Text>
          
          <View style={[styles.row, { borderBottomColor: colors.background }]}>
            <View style={styles.rowLabelContainer}>
              <Ionicons name="color-palette-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Theme Mode</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>

          <View style={[styles.row, { borderBottomColor: colors.background }]}>
            <View style={styles.rowLabelContainer}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Version</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textSecondary }]}>1.0.0 (Production)</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLabelContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Security Level</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.success, fontWeight: 'bold' }]}>High (RBAC)</Text>
          </View>
        </View>

        {/* Sign Out Action Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.danger }]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out from Admin Panel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  email: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
