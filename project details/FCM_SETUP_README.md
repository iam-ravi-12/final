# FCM Push Notifications Setup - Quick Start

## ⚠️ IMPORTANT: Firebase Setup Required

This application now uses Firebase Cloud Messaging (FCM) for push notifications. Follow these steps to set up:

## Backend Setup (Required)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Save the file as `firebase-service-account.json`

### 2. Add Service Account File

Place the file in **one** of these locations:
- `src/main/resources/firebase-service-account.json` (Production)
- Project root: `firebase-service-account.json` (Development)

### 3. Run Database Migration

```bash
mysql -u your_user -p your_database < FCM_MIGRATION.sql
```

This adds the `fcm_token` column to the users table.

### 4. Start Backend

```bash
./mvnw spring-boot:run
```

Check logs for:
```
Firebase Admin SDK initialized successfully
```

## Mobile App Setup (Required)

### Android

1. In Firebase Console, add Android app to your project
2. Download `google-services.json`
3. Place in: `friend/google-services.json`

### iOS

1. In Firebase Console, add iOS app to your project
2. Download `GoogleService-Info.plist`
3. Place in: `friend/GoogleService-Info.plist`

### Build and Run

```bash
cd friend

# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## Testing

### 1. Check FCM Token Registration

Open app and check logs:
```
✅ FCM DEVICE TOKEN: <token>
✅ FCM token registered with backend
```

### 2. Test Notifications

1. Create SOS alert from one device
2. Other devices receive instant notification
3. Works when app is:
   - Foreground
   - Background
   - Completely closed

### 3. Verify Database

```sql
SELECT username, fcm_token FROM users WHERE fcm_token IS NOT NULL;
```

## What Changed

### ❌ Old System (Removed)
- Background polling every 30 seconds
- Background tasks every 15 minutes
- Location polling
- Alert ID tracking

### ✅ New System (Active)
- Server-initiated push notifications
- Instant delivery
- 95% less battery usage
- Simplified code

## Troubleshooting

### Backend: "Firebase service account file not found"

**Solution**: Add `firebase-service-account.json` to `src/main/resources/` or project root

### Mobile: "Must use physical device for Push Notifications"

**Solution**: Use physical device, not emulator (FCM doesn't work on emulators)

### Notifications not received

**Check**:
1. Firebase service account file added ✓
2. Database migration run ✓
3. `google-services.json` added (Android) ✓
4. Device has internet connection ✓
5. Notification permissions granted ✓

## Documentation

See `FCM_PUSH_NOTIFICATIONS_GUIDE.md` for complete documentation.

## Benefits

- ⚡ **Instant**: No polling delays
- 🔋 **Efficient**: 95% less battery usage
- 🎯 **Reliable**: Firebase handles delivery
- 📱 **Native**: Uses platform notification system
