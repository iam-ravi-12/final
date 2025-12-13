import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationService {
  requestPermissions: () => Promise<boolean>;
  scheduleLocalNotification: (title: string, body: string, data?: any) => Promise<string | undefined>;
  cancelAllNotifications: () => Promise<void>;
  setupNotificationChannel: () => Promise<void>;
  getBadgeCount: () => Promise<number>;
  setBadgeCount: (count: number) => Promise<void>;
}

class NotificationServiceImpl implements NotificationService {
  /**
   * Request notification permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permissions');
      return false;
    }

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
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }
  }

  /**
   * Schedule a local notification
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

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
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
 * Helper function to show SOS alert notification
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

  const title = emergencyLabels[emergencyType] || '🚨 SOS Alert';
  const distanceText = distance
    ? distance < 1
      ? `${(distance * 1000).toFixed(0)} meters away`
      : `${distance.toFixed(1)} km away`
    : 'nearby';

  const body = `${username} needs help - ${distanceText}`;

  await notificationService.scheduleLocalNotification(title, body, {
    type: 'sos-alert',
    username,
    emergencyType,
    distance,
  });
}
