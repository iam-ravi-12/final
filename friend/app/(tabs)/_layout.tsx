import { Tabs } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import sosService from '@/services/sosService';
import notificationService from '@/services/notificationService';
import { useChat } from '@/contexts/ChatContext';

// ── Glow palette ─────────────────────────────────────────────────────────────
// Light mode navbar: rich dark navy pill with vivid blue-cyan glow on active
const NAV_BG_LIGHT       = '#0D1829';   // Deep navy — consistent in both modes
const NAV_BORDER_LIGHT   = 'rgba(56, 189, 248, 0.28)';
const NAV_GLOW_LIGHT     = '#38BDF8';   // Electric cyan glow

// Inactive icon/label colors in the dark pill
const INACTIVE_COLOR     = 'rgba(189, 216, 233, 0.50)';
const ACTIVE_COLOR_LIGHT = '#38BDF8';   // Electric cyan
const ACTIVE_COLOR_DARK  = '#38BDF8';   // Same cyan in dark mode

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);
  const { totalUnreadCount } = useChat();
  const [sosUnreadCount, setSosUnreadCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    initializeFcmNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('FCM Notification received:', notification);
      loadSosUnreadCount();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const initializeFcmNotifications = async () => {
    const fcmToken = await notificationService.registerForPushNotificationsAsync();
    if (fcmToken) {
      console.log('FCM initialized successfully');
    }
  };

  const loadSosUnreadCount = useCallback(async () => {
    try {
      const count = await sosService.getUnreadCount();
      setSosUnreadCount(count);
      await notificationService.setBadgeCount(count);
    } catch (err) {
      console.error('Error loading SOS unread count:', err);
    }
  }, []);

  useEffect(() => {
    loadSosUnreadCount();
    const interval = setInterval(loadSosUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadSosUnreadCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        loadSosUnreadCount();
      }
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); };
  }, []);

  // Active glow colour — cyan in both modes
  const activeColor = isDark ? ACTIVE_COLOR_DARK : ACTIVE_COLOR_LIGHT;

  /**
   * Renders a tab icon with:
   * - A glowing radial halo behind it when focused
   * - A small dot indicator below
   * - Light icon when unfocused (visible against the dark pill)
   */
  const renderTabIcon = (icon: React.ReactNode, focused: boolean) => {
    return (
      <View style={styles.tabIconWrapper}>
        {focused && (
          <>
            {/* Outermost ring — very faint, wide spread */}
            <View style={[
              styles.glowRing,
              { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(56, 189, 248, 0.05)' },
            ]} />
            {/* Mid ring */}
            <View style={[
              styles.glowRing,
              { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(56, 189, 248, 0.11)' },
            ]} />
            {/* Inner bright core */}
            <View style={[
              styles.glowRing,
              { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(56, 189, 248, 0.22)' },
            ]} />
          </>
        )}
        {icon}
      </View>
    );
  };

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
      screenOptions={{
        tabBarActiveTintColor: activeColor,
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
          // Always dark pill — matches branding in both light + dark mode
          backgroundColor: NAV_BG_LIGHT,
          borderTopWidth: 0,
          borderWidth: 1.5,
          borderColor: NAV_BORDER_LIGHT,
          shadowColor: NAV_GLOW_LIGHT,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.20,
          shadowRadius: 18,
          elevation: 16,
          paddingHorizontal: 8,
          paddingBottom: 0,
          paddingTop: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(<IconSymbol size={24} name="house.fill" color={color} />, focused),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(<Ionicons name="people" size={24} color={color} />, focused),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(
              <View>
                <Ionicons name="chatbubbles" size={24} color={color} />
                {totalUnreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                      {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </Text>
                  </View>
                )}
              </View>,
              focused
            ),
        }}
      />
      <Tabs.Screen
        name="sos-alerts"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(
              <View>
                <Ionicons name="warning" size={24} color={color} />
                {sosUnreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{sosUnreadCount > 99 ? '99+' : sosUnreadCount}</Text>
                  </View>
                )}
              </View>,
              focused
            ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar
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
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
