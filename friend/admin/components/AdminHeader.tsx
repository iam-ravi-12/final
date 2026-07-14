import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

export default function AdminHeader({
  title,
  subtitle,
  showLogout = true,
}: AdminHeaderProps) {
  const { colors } = useAppTheme();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.header, 
      { 
        backgroundColor: colors.surface, 
        borderBottomColor: colors.surfaceBorder,
        paddingTop: Math.max(insets.top, 16),
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>

        {showLogout && (
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.background }]}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1.5,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
