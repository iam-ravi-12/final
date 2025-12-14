import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import sosService from './sosService';
import { showSosAlertNotification } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_FETCH_TASK = 'sos-alerts-background-fetch';
const LAST_ALERT_IDS_KEY = 'lastSosAlertIds';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[Background] Checking for new SOS alerts...');
    
    // Get previously stored alert IDs
    const lastIdsJson = await AsyncStorage.getItem(LAST_ALERT_IDS_KEY);
    const lastAlertIds = lastIdsJson ? new Set(JSON.parse(lastIdsJson)) : new Set();
    
    // Fetch current active alerts
    const alerts = await sosService.getActiveAlerts();
    
    // Find new alerts
    const newAlerts = alerts.filter(alert => 
      !lastAlertIds.has(alert.id) && !alert.isCurrentUserAlertOwner
    );
    
    if (newAlerts.length > 0) {
      console.log(`[Background] Found ${newAlerts.length} new alert(s)`);
      
      // Send notification for each new alert
      for (const alert of newAlerts) {
        await showSosAlertNotification(
          alert.username,
          alert.emergencyType,
          alert.distance
        );
      }
    } else {
      console.log('[Background] No new alerts');
    }
    
    // Update stored alert IDs
    const currentAlertIds = alerts.map(a => a.id);
    await AsyncStorage.setItem(LAST_ALERT_IDS_KEY, JSON.stringify(currentAlertIds));
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background] Error checking alerts:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const BackgroundNotificationService = {
  /**
   * Register background fetch task
   */
  async registerBackgroundFetch(): Promise<void> {
    try {
      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
      
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60, // 15 minutes minimum interval
          stopOnTerminate: false, // Continue after app is terminated
          startOnBoot: true, // Start on device boot
        });
        console.log('[Background] Background fetch registered successfully');
      } else {
        console.log('[Background] Background fetch already registered');
      }
    } catch (error) {
      console.error('[Background] Failed to register background fetch:', error);
    }
  },

  /**
   * Unregister background fetch task
   */
  async unregisterBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('[Background] Background fetch unregistered');
    } catch (error) {
      console.error('[Background] Failed to unregister background fetch:', error);
    }
  },

  /**
   * Check background fetch status
   */
  async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
    return await BackgroundFetch.getStatusAsync();
  },

  /**
   * Initialize last alert IDs from current alerts
   */
  async initializeAlertIds(): Promise<void> {
    try {
      const alerts = await sosService.getActiveAlerts();
      const alertIds = alerts.map(a => a.id);
      await AsyncStorage.setItem(LAST_ALERT_IDS_KEY, JSON.stringify(alertIds));
      console.log('[Background] Initialized with', alertIds.length, 'alert IDs');
    } catch (error) {
      console.error('[Background] Failed to initialize alert IDs:', error);
    }
  },
};

export default BackgroundNotificationService;
