import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Configure notification behavior (how notifications look when app is open)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export interface NotificationService {
    registerForPushNotificationsAsync: () => Promise<string | null>;
    scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<string | undefined>;
    cancelAllNotifications: () => Promise<void>;
    setupNotificationChannel: () => Promise<void>;
    getBadgeCount: () => Promise<number>;
    setBadgeCount: (count: number) => Promise<void>;
}

class NotificationServiceImpl implements NotificationService {

    /**
     * NEW: Register for Push Notifications and get the FCM Token
     * Call this from your TabLayout or Login screen
     */
    async registerForPushNotificationsAsync(): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return null;
        }

        // 1. Setup the Channel FIRST (Critical for Android High Priority)
        await this.setupNotificationChannel();

        // 2. Check & Request Permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get notification permissions');
            return null;
        }

        // 3. Get the Device Token (FCM Token)
        try {
            // We use getDevicePushTokenAsync to get the raw token for Spring Boot/Firebase
            const tokenData = await Notifications.getDevicePushTokenAsync();
            const fcmToken = tokenData.data;

            console.log("✅ FCM DEVICE TOKEN:", fcmToken);
            return fcmToken;
        } catch (error) {
            console.error("❌ Error fetching push token:", error);
            return null;
        }
    }

    /**
     * Setup notification channel for Android
     * MATCH THIS ID ('sos-alerts') WITH YOUR SPRING BOOT CODE
     */
    async setupNotificationChannel(): Promise<void> {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('sos-alerts', {
                name: 'SOS Alerts',
                importance: Notifications.AndroidImportance.MAX, // Heads-up notification
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF0000',
                sound: 'default', // Ensure your backend sends "default" or matches a custom sound file
                enableLights: true,
                enableVibrate: true,
                showBadge: true,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true, // Attempt to bypass Do Not Disturb
            });
        }
    }

    /**
     * Schedule a local notification (For testing or internal app alerts)
     */
    async scheduleLocalNotification(
        title: string,
        body: string,
        data?: any
    ): Promise<string | undefined> {
        try {
            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    badge: 1,
                    // Ensure this matches the channel created above
                    ...(Platform.OS === 'android' && {
                        channelId: 'sos-alerts',
                    }),
                },
                trigger: null, // Show immediately
            });

            return identifier;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return undefined;
        }
    }

<<<<<<< HEAD
    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
=======
    return true;
  }

  /**
   * Setup notification channel for Android
   */
  async setupNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sos-alerts', {
        name: 'SOS Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250, 250, 250, 250, 250, 250, 250],
        lightColor: '#FF0000',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
>>>>>>> ee39bfd31fbb914f5fd7ed985e75cea1eba37d01
    }

    /**
     * Get current badge count
     */
    async getBadgeCount(): Promise<number> {
        return await Notifications.getBadgeCountAsync();
    }

    /**
     * Set badge count
     */
    async setBadgeCount(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    }
}

const notificationService = new NotificationServiceImpl();

export default notificationService;

/**
 * Helper function to show SOS alert notification (Local fallback)
 */
export async function showSosAlertNotification(
    username: string,
    emergencyType: string,
    distance?: number | null
): Promise<void> {
    const emergencyLabels: Record<string, string> = {
        IMMEDIATE_EMERGENCY: '🚨 Emergency',
        ACCIDENT: '🚑 Accident',
        WOMEN_SAFETY: '👩 Women Safety',
        MEDICAL: '⚕️ Medical',
        FIRE: '🔥 Fire',
    };

<<<<<<< HEAD
    const title = emergencyLabels[emergencyType] || '🚨 SOS Alert';
    const distanceText = distance
        ? distance < 1
            ? `${(distance * 1000).toFixed(0)} meters away`
            : `${distance.toFixed(1)} km away`
        : 'nearby';
=======
  const title = emergencyLabels[emergencyType] || '🚨 SOS Alert';
  
  // Always show distance in meters if available, otherwise show "location unknown"
  let distanceText = 'location unknown';
  if (distance !== null && distance !== undefined) {
    if (distance < 1) {
      // Less than 1 km - show in meters
      const meters = Math.round(distance * 1000);
      distanceText = `${meters} meter${meters === 1 ? '' : 's'} away`;
    } else {
      // 1 km or more - show in km with one decimal
      distanceText = `${distance.toFixed(1)} km away`;
    }
  }
>>>>>>> ee39bfd31fbb914f5fd7ed985e75cea1eba37d01

    const body = `${username} needs help - ${distanceText}`;

    await notificationService.scheduleLocalNotification(title, body, {
        type: 'sos-alert',
        username,
        emergencyType,
        distance,
    });
}