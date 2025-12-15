// import * as BackgroundFetch from 'expo-background-fetch';
// import * as TaskManager from 'expo-task-manager';
// import * as Location from 'expo-location';
// import sosService from './sosService';
// import { showSosAlertNotification } from './notificationService';
// import AsyncStorage from '@react-native-async-storage/async-storage';
//
// const BACKGROUND_FETCH_TASK = 'sos-alerts-background-fetch';
// const LAST_ALERT_IDS_KEY = 'lastSosAlertIds';
// const RADIUS_KM = 5; // Only notify users within 5km radius
//
// // Define the background task
// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
//   try {
//     console.log('[Background] Checking for new SOS alerts...');
//
//     // Get user's current location
//     let userLocation: { latitude: number; longitude: number } | null = null;
//     try {
//       const { status } = await Location.getBackgroundPermissionsAsync();
//       if (status === 'granted') {
//         const location = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.Balanced,
//         });
//         userLocation = {
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//         };
//         console.log('[Background] Got user location:', userLocation);
//       } else {
//         console.log('[Background] Location permission not granted');
//       }
//     } catch (locError) {
//       console.error('[Background] Error getting location:', locError);
//     }
//
//     // Get previously stored alert IDs
//     const lastIdsJson = await AsyncStorage.getItem(LAST_ALERT_IDS_KEY);
//     const lastAlertIds = lastIdsJson ? new Set(JSON.parse(lastIdsJson)) : new Set();
//
//     // Fetch current active alerts within 5km radius
//     const alerts = await sosService.getActiveAlerts(
//       userLocation?.latitude,
//       userLocation?.longitude,
//       RADIUS_KM
//     );
//
//     console.log(`[Background] Found ${alerts.length} alerts within ${RADIUS_KM}km`);
//
//     // Find new alerts
//     const newAlerts = alerts.filter(alert =>
//       !lastAlertIds.has(alert.id) && !alert.isCurrentUserAlertOwner
//     );
//
//     if (newAlerts.length > 0) {
//       console.log(`[Background] Found ${newAlerts.length} new alert(s)`);
//
//       // Send notification for each new alert
//       for (const alert of newAlerts) {
//         await showSosAlertNotification(
//           alert.username,
//           alert.emergencyType,
//           alert.distance
//         );
//       }
//     } else {
//       console.log('[Background] No new alerts');
//     }
//
//     // Update stored alert IDs
//     const currentAlertIds = alerts.map(a => a.id);
//     await AsyncStorage.setItem(LAST_ALERT_IDS_KEY, JSON.stringify(currentAlertIds));
//
//     return BackgroundFetch.BackgroundFetchResult.NewData;
//   } catch (error) {
//     console.error('[Background] Error checking alerts:', error);
//     return BackgroundFetch.BackgroundFetchResult.Failed;
//   }
// });
//
// export const BackgroundNotificationService = {
//   /**
//    * Register background fetch task
//    */
//   async registerBackgroundFetch(): Promise<void> {
//     try {
//       // Check if task is already registered
//       const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
//
//       if (!isRegistered) {
//         await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
//           minimumInterval: 15 * 60, // 15 minutes minimum interval
//           stopOnTerminate: false, // Continue after app is terminated
//           startOnBoot: true, // Start on device boot
//         });
//         console.log('[Background] Background fetch registered successfully');
//       } else {
//         console.log('[Background] Background fetch already registered');
//       }
//     } catch (error) {
//       console.error('[Background] Failed to register background fetch:', error);
//     }
//   },
//
//   /**
//    * Unregister background fetch task
//    */
//   async unregisterBackgroundFetch(): Promise<void> {
//     try {
//       await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
//       console.log('[Background] Background fetch unregistered');
//     } catch (error) {
//       console.error('[Background] Failed to unregister background fetch:', error);
//     }
//   },
//
//   /**
//    * Check background fetch status
//    */
//   async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
//     return await BackgroundFetch.getStatusAsync();
//   },
//
//   /**
//    * Initialize last alert IDs from current alerts
//    */
//   async initializeAlertIds(): Promise<void> {
//     try {
//       const alerts = await sosService.getActiveAlerts();
//       const alertIds = alerts.map(a => a.id);
//       await AsyncStorage.setItem(LAST_ALERT_IDS_KEY, JSON.stringify(alertIds));
//       console.log('[Background] Initialized with', alertIds.length, 'alert IDs');
//     } catch (error) {
//       console.error('[Background] Failed to initialize alert IDs:', error);
//     }
//   },
// };
//
// export default BackgroundNotificationService;


import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import sosService from './sosService';
import { showSosAlertNotification } from './notificationService';

const BACKGROUND_FETCH_TASK = 'sos-alerts-background-fetch';
const LAST_ALERT_IDS_KEY = 'lastSosAlertIds';
const RADIUS_KM = 5;

// Lazy-loaded native modules
let TaskManager: any = null;
let BackgroundFetch: any = null;
let Location: any = null;

if (Platform.OS !== 'web') {
    try {
        TaskManager = require('expo-task-manager');
        BackgroundFetch = require('expo-background-fetch');
        Location = require('expo-location');
    } catch (e) {
        console.warn('Background services unavailable:', e);
    }
}

/**
 * DEFINE BACKGROUND TASK (GUARDED)
 */
if (TaskManager?.defineTask) {
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
        try {
            console.log('[Background] Checking for new SOS alerts...');

            let userLocation: { latitude: number; longitude: number } | null = null;

            try {
                const { status } = await Location.getBackgroundPermissionsAsync();
                if (status === 'granted') {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    userLocation = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };
                }
            } catch (e) {
                console.warn('[Background] Location error:', e);
            }

            const lastIdsJson = await AsyncStorage.getItem(LAST_ALERT_IDS_KEY);
            const lastAlertIds = lastIdsJson
                ? new Set<string>(JSON.parse(lastIdsJson))
                : new Set<string>();

            const alerts = await sosService.getActiveAlerts(
                userLocation?.latitude,
                userLocation?.longitude,
                RADIUS_KM
            );

            const newAlerts = alerts.filter(
                a => !lastAlertIds.has(a.id) && !a.isCurrentUserAlertOwner
            );

            for (const alert of newAlerts) {
                await showSosAlertNotification(
                    alert.username,
                    alert.emergencyType,
                    alert.distance
                );
            }

            await AsyncStorage.setItem(
                LAST_ALERT_IDS_KEY,
                JSON.stringify(alerts.map(a => a.id))
            );

            return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
            console.error('[Background] Task failed:', error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }
    });
}

const BackgroundNotificationService = {
    async registerBackgroundFetch(): Promise<void> {
        if (!TaskManager || !BackgroundFetch) {
            console.warn('Background fetch not supported on this platform');
            return;
        }

        const isRegistered = await TaskManager.isTaskRegisteredAsync(
            BACKGROUND_FETCH_TASK
        );

        if (!isRegistered) {
            await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
                minimumInterval: 15 * 60,
                stopOnTerminate: false,
                startOnBoot: true,
            });
        }
    },

    async unregisterBackgroundFetch(): Promise<void> {
        if (!BackgroundFetch) return;
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    },

    async getBackgroundFetchStatus() {
        if (!BackgroundFetch) return null;
        return await BackgroundFetch.getStatusAsync();
    },

    async initializeAlertIds(): Promise<void> {
        try {
            const alerts = await sosService.getActiveAlerts();
            await AsyncStorage.setItem(
                LAST_ALERT_IDS_KEY,
                JSON.stringify(alerts.map(a => a.id))
            );
        } catch (e) {
            console.warn('[Background] Init failed:', e);
        }
    },
};

export default BackgroundNotificationService;
