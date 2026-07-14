import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import { HapticTab } from '@/components/haptic-tab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Glow palette ─────────────────────────────────────────────────────────────
const NAV_BG       = '#0D1829';   // Deep navy background consistent with main app
const NAV_BORDER   = 'rgba(56, 189, 248, 0.28)';
const NAV_GLOW     = '#38BDF8';   // Electric cyan active glow
const INACTIVE_COLOR = 'rgba(189, 216, 233, 0.50)';

export default function AdminLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);

  const renderTabIcon = (iconName: string, focused: boolean, color: string) => {
    return (
      <View style={styles.tabIconWrapper}>
        {focused && (
          <>
            {/* Outermost ring — very faint */}
            <View style={[
              styles.glowRing,
              { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(56, 189, 248, 0.05)' },
            ]} />
            {/* Mid ring */}
            <View style={[
              styles.glowRing,
              { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(56, 189, 248, 0.11)' },
            ]} />
            {/* Inner core */}
            <View style={[
              styles.glowRing,
              { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(56, 189, 248, 0.22)' },
            ]} />
          </>
        )}
        <Ionicons name={iconName as any} size={22} color={color} />
      </View>
    );
  };

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
      screenOptions={{
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: INACTIVE_COLOR,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
          height: '100%',
          paddingTop: 0,
          paddingBottom: 0,
        },
        tabBarIconStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 0,
          marginBottom: 0,
          width: '100%',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomOffset,
          left: 20,
          right: 20,
          height: 62,
          borderRadius: 31,
          backgroundColor: NAV_BG,
          borderTopWidth: 0,
          borderWidth: 1.5,
          borderColor: NAV_BORDER,
          shadowColor: NAV_GLOW,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.20,
          shadowRadius: 18,
          elevation: 16,
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('speedometer', focused, color),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('people', focused, color),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('flag', focused, color),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: 'Communities',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('people-circle', focused, color),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Posts',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('document-text', focused, color),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon('settings', focused, color),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minWidth: 40,
    overflow: 'visible',
  },
  glowRing: {
    position: 'absolute',
  },
});
