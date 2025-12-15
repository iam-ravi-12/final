import { Tabs } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import sosService from '@/services/sosService';
import notificationService, { showSosAlertNotification } from '@/services/notificationService';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [sosUnreadCount, setSosUnreadCount] = useState(0);
  const previousAlertIdsRef = useRef<Set<number>>(new Set());
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Initialize notifications
    initializeNotifications();

    // Setup notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Navigate to SOS alerts when user taps notification
      // The tab navigation will handle this
    });

    return () => {
      if (notificationListener.current) {
          notificationListener.current?.remove();
      }
      if (responseListener.current) {
          responseListener.current?.remove();
      }
    };
  }, []);

  const initializeNotifications = async () => {
    const hasPermission = await notificationService.requestPermissions();
    if (hasPermission) {
      await notificationService.setupNotificationChannel();
    }
  };

  useEffect(() => {
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

    loadSosUnreadCount();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadSosUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Monitor for new alerts and send notifications
  useEffect(() => {
    const checkForNewAlerts = async () => {
      try {
        const alerts = await sosService.getActiveAlerts();
        
        // On initial load, just store the current alerts without sending notifications
        if (isInitialLoadRef.current) {
          const initialAlertIds = new Set(alerts.map(a => a.id));
          previousAlertIdsRef.current = initialAlertIds;
          isInitialLoadRef.current = false;
          console.log('Initial load - stored alert IDs:', initialAlertIds.size);
          return;
        }
        
        // Check for new alerts that weren't in previous set
        const newAlerts = alerts.filter(alert => 
          !previousAlertIdsRef.current.has(alert.id) && !alert.isCurrentUserAlertOwner
        );

        if (newAlerts.length > 0) {
          console.log('Found new alerts:', newAlerts.length);
          // Show notification for each new alert
          for (const alert of newAlerts) {
            console.log('Sending notification for alert:', alert.id, alert.username);
            await showSosAlertNotification(
              alert.username,
              alert.emergencyType,
              alert.distance
            );
          }
        }

        // Update the set of known alert IDs
        const currentAlertIds = new Set(alerts.map(a => a.id));
        previousAlertIdsRef.current = currentAlertIds;
      } catch (err) {
        console.error('Error checking for new alerts:', err);
      }
    };

    // Initial check
    checkForNewAlerts();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(checkForNewAlerts, 30000);
    return () => clearInterval(interval);
  }, []); // Remove dependency on previousAlertIds

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh counts
        sosService.getUnreadCount().then(count => {
          setSosUnreadCount(count);
          notificationService.setBadgeCount(count);
        });
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
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="envelope.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sos-alerts"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={28} name="exclamationmark.triangle.fill" color={color} />
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
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
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
