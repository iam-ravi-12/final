# SOS Alert Notification Feature

## Overview
This feature adds live notification counts for SOS alerts, similar to WhatsApp's notification system. Users can see the number of new/unread SOS alerts in real-time on both the web and mobile applications.

## Features

### 1. Real-time Notification Badges
- **Web App (React)**: Red notification badge on the "SOS Alerts" navigation item in the sidebar
- **Mobile App (React Native)**: Red notification badge on the "SOS" tab in the bottom navigation

### 2. Live Updates
- Notification count refreshes automatically every 30 seconds
- Count updates immediately when user views the SOS Alerts page
- Excludes user's own SOS alerts from the count

### 3. Mark as Read Functionality
- When user opens the SOS Alerts page, alerts are automatically marked as read
- The notification count resets to show only new alerts created after the last visit

## Technical Implementation

### Backend Changes

#### 1. Database Schema
Added a new column to the `users` table:
```sql
ALTER TABLE users ADD COLUMN last_sos_check_at TIMESTAMP NULL;
```

This column tracks when a user last viewed the SOS Alerts page.

#### 2. New API Endpoints

##### Get Unread Count
```
GET /api/sos/alerts/unread-count
Authorization: Bearer <token>

Response:
{
  "count": 5
}
```

Returns the number of active SOS alerts created after the user's last check time.

##### Mark Alerts as Read
```
POST /api/sos/alerts/mark-read
Authorization: Bearer <token>

Response:
{
  "message": "SOS alerts marked as read",
  "status": "success"
}
```

Updates the user's `last_sos_check_at` timestamp to the current time.

#### 3. Service Layer Changes
- `SosService.getUnreadSosAlertsCount(String username)`: Calculates unread alerts count
- `SosService.markSosAlertsAsRead(String username)`: Updates last check timestamp

### Frontend Changes (React Web)

#### 1. Service Updates
Added methods to `sosService.js`:
- `getUnreadCount()`: Fetches unread alert count from API
- `markAlertsAsRead()`: Marks alerts as read when page is viewed

#### 2. Home Component Updates
- Added state for `sosUnreadCount`
- Polls for unread count every 30 seconds
- Displays notification badge when count > 0

#### 3. SOS Alerts Page Updates
- Calls `markAlertsAsRead()` when component mounts
- Resets notification count to zero

#### 4. CSS Styling
Added `.notification-badge` class with:
- Red background (#ef4444)
- White text
- Pulse animation for visibility
- Positioned on navigation items

### Mobile App Changes (React Native)

#### 1. Service Updates
Added methods to `sosService.ts`:
- `getUnreadCount()`: Fetches unread alert count from API
- `markAlertsAsRead()`: Marks alerts as read when screen is viewed

#### 2. Tab Layout Updates
- Added state for `sosUnreadCount`
- Polls for unread count every 30 seconds
- Custom badge component on SOS tab icon

#### 3. SOS Alerts Screen Updates
- Calls `markAlertsAsRead()` when screen mounts
- Resets notification count to zero

## How It Works

### Notification Count Logic
1. When user logs in, the system checks their `last_sos_check_at` timestamp
2. If null (never checked), all active alerts are counted as unread
3. If set, only alerts created after this timestamp are counted
4. User's own alerts are excluded from the count
5. Only valid (not expired) alerts are included

### Alert Validity
Alerts are considered valid based on their type:
- IMMEDIATE_EMERGENCY, WOMEN_SAFETY, MEDICAL: 24 hours
- FIRE: 48 hours (2 days)
- ACCIDENT: 72 hours (3 days)

### Polling Strategy
- Both web and mobile apps poll the unread count endpoint every 30 seconds
- Polling starts when app loads and stops when unmounted
- Minimal server impact due to simple count query

## User Experience

### Web Application
1. User sees a red badge with number on "SOS Alerts" navigation item
2. Badge pulses to draw attention
3. Clicking on "SOS Alerts" opens the page and badge disappears
4. New alerts appearing while browsing cause badge to reappear with updated count

### Mobile Application
1. User sees a red badge with number on "SOS" tab icon
2. Badge appears in top-right corner of the icon
3. Tapping on "SOS" tab opens alerts screen and badge disappears
4. New alerts appearing cause badge to reappear with updated count

## Database Migration

If using automatic schema updates (JPA ddl-auto=update), the new column will be added automatically on application startup.

For manual migration, run the SQL in `SOS_NOTIFICATION_MIGRATION.sql`:
```bash
mysql -u username -p database_name < SOS_NOTIFICATION_MIGRATION.sql
```

## Testing

### Manual Testing Steps

1. **Create a Test Alert**
   - Login as User A
   - Create an SOS alert from the SOS Button

2. **Check Notification Badge**
   - Login as User B
   - Verify notification badge appears on SOS Alerts navigation
   - Note the count (should be 1)

3. **View Alerts**
   - Click on SOS Alerts
   - Verify alerts are displayed
   - Navigate back to home
   - Verify badge has disappeared

4. **Create Another Alert**
   - Switch back to User A
   - Create another SOS alert
   - Switch to User B
   - Verify badge reappears with count of 1 (new alert only)

5. **Test Real-time Updates**
   - Have User A create an alert
   - Watch User B's interface (wait up to 30 seconds)
   - Verify badge count increments automatically

## Performance Considerations

- The unread count query is optimized and uses indexed columns
- Polling interval of 30 seconds balances freshness with server load
- Count calculation excludes user's own alerts to reduce noise
- Expired alerts are filtered out during count calculation

## Future Enhancements

Possible improvements for future versions:
1. WebSocket-based real-time updates (instead of polling)
2. Push notifications for critical emergency types
3. Sound alerts for new SOS notifications
4. Notification history/archive
5. Different badge colors for emergency severity levels
6. User preference to enable/disable notifications
7. Granular notification settings per emergency type

## Troubleshooting

### Badge Not Appearing
1. Check if user is authenticated
2. Verify API endpoint is accessible
3. Check browser console for JavaScript errors
4. Ensure backend service is running

### Badge Not Resetting
1. Verify `markAlertsAsRead()` is being called
2. Check network tab to ensure POST request succeeds
3. Verify database column `last_sos_check_at` is being updated

### Count Seems Wrong
1. Remember: count excludes user's own alerts
2. Only valid (non-expired) alerts are counted
3. Check alert creation timestamps vs user's last check timestamp

## API Reference

See the main API documentation for complete details on:
- Authentication requirements
- Request/response formats
- Error handling
- Rate limiting
