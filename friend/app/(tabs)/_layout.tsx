import { Tabs } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/constants/AppTheme';
import sosService from '@/services/sosService';
import notificationService from '@/services/notificationService';
import { useChat } from '@/contexts/ChatContext';

export default function TabLayout() {
  const { colors, isDark } = useAppTheme();
  const { totalUnreadCount } = useChat();
  const [sosUnreadCount, setSosUnreadCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Initialize FCM push notifications
    initializeFcmNotifications();

    // Setup notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('FCM Notification received:', notification);
      // Refresh unread count when notification arrives
      loadSosUnreadCount();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // The tab navigation will handle switching to SOS tab
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
    // Register for push notifications and send FCM token to backend
    const fcmToken = await notificationService.registerForPushNotificationsAsync();
    if (fcmToken) {
      console.log('FCM initialized successfully');
    }
  };

  const loadSosUnreadCount = async () => {
    try {
      const count = await sosService.getUnreadCount();
      setSosUnreadCount(count);
      
      // Update badge count on app icon
      await notificationService.setBadgeCount(count);
    } catch (err) {
      console.error('Error loading SOS unread count:', err);
    }
  };

  useEffect(() => {
    loadSosUnreadCount();
    
    // Poll for unread count updates every 30 seconds (for badge only)
    const interval = setInterval(loadSosUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh counts
        loadSosUnreadCount();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const renderTabIcon = (icon: React.ReactNode, focused: boolean) => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: 30,
          minWidth: 40,
        }}
      >
        {icon}
        {focused && (
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#7BBDE8',
              marginTop: 2,
            }}
          />
        )}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7BBDE8',
        tabBarInactiveTintColor: '#BDD8E9',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarItemStyle: {
          paddingVertical: 4,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
          paddingBottom: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,
          height: 62,
          borderRadius: 31,
          backgroundColor: 'rgba(0, 29, 57, 0.94)',
          borderTopWidth: 0,
          borderWidth: 1.5,
          borderColor: 'rgba(123, 189, 232, 0.35)',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 12,
          paddingHorizontal: 8,
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
                    <Text style={[styles.badgeText, { color: colors.textInverse }]}>
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
                    <Text style={[styles.badgeText, { color: colors.textInverse }]}>{sosUnreadCount > 99 ? '99+' : sosUnreadCount}</Text>
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
