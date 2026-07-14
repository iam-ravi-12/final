import { Tabs } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import sosService from '@/services/sosService';
import notificationService from '@/services/notificationService';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [sosUnreadCount, setSosUnreadCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sos-alerts"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color }) => (
            <View>
              <Ionicons name="warning" size={28} color={color} />
              {sosUnreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{sosUnreadCount > 99 ? '99+' : sosUnreadCount}</Text>
                </View>
              )}
            </View>
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
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
