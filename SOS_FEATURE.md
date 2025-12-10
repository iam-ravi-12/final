# SOS Feature Documentation

## Overview

The SOS feature is an emergency alert system integrated into the Professional Network application. It allows users to send emergency alerts to nearby community members and emergency services with just a tap, making it especially useful for accidents, medical emergencies, women's safety, and other critical situations.

## Key Features

### 1. Always-Visible SOS Button
- **Web**: Fixed floating button in the bottom-right corner of the screen
- **Mobile**: Floating button positioned above the create post FAB
- Bright red color with pulsing animation for visibility
- Accessible from the home screen at all times

### 2. 15-Second Countdown Timer
- When the SOS button is clicked, a modal appears with a 15-second countdown
- Users can cancel the alert during the countdown period
- If no action is taken, the alert is automatically sent after 15 seconds
- Manual "Send Now" button for immediate alerts

### 3. Emergency Type Selection
Choose from five emergency types:
- 🚨 **Immediate Emergency**: For immediate safety concerns requiring urgent attention
- 🚑 **Accident**: For traffic or other accidents
- 👩 **Women Safety**: Specifically for women's safety emergencies
- ⚕️ **Medical Emergency**: For medical situations requiring immediate help
- 🔥 **Fire**: For fire emergencies

### 4. Location Tracking
- Automatic location detection using GPS/geolocation
- Location permissions requested on first use
- Alerts include latitude, longitude, and location address
- Distance calculation shows how far away alerts are from users

### 5. Active Alerts Page
- View all active SOS alerts in the area
- Alerts are sorted by time and distance
- Real-time updates every 30 seconds
- Pull-to-refresh functionality on mobile
- Filter alerts within 50km radius by default

### 6. Response System
Users can respond to alerts with different response types:
- **On My Way** (10 points): Indicating you're heading to help
- **Contacted Authorities** (15 points): Called emergency services
- **Reached Location** (25 points): Arrived at the scene
- **Resolved** (50 points): Emergency has been resolved

### 7. Leaderboard Points System
- Users earn points for helping others
- Different response types award different point values
- Points are tracked in the user's profile
- Leaderboard shows top helpers in the community
- Encourages community participation and mutual aid

## Technical Implementation

### Backend API Endpoints

#### Create SOS Alert
```
POST /api/sos/alert
Authorization: Bearer <token>

Request Body:
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "locationAddress": "San Francisco, CA",
  "emergencyType": "WOMEN_SAFETY",
  "description": "Need help urgently"
}
```

#### Get Active Alerts
```
GET /api/sos/alerts/active?latitude=37.7749&longitude=-122.4194&radiusKm=50
Authorization: Bearer <token>
```

#### Respond to Alert
```
POST /api/sos/respond
Authorization: Bearer <token>

Request Body:
{
  "sosAlertId": 1,
  "responseType": "ON_WAY",
  "message": "I'm on my way to help"
}
```

#### Cancel Alert
```
PUT /api/sos/alert/{alertId}/cancel
Authorization: Bearer <token>
```

#### Get Leaderboard
```
GET /api/sos/leaderboard?limit=50
Authorization: Bearer <token>
```

### Database Schema

#### sos_alerts Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `location_address`: Human-readable address
- `emergency_type`: Type of emergency (IMMEDIATE_EMERGENCY, ACCIDENT, WOMEN_SAFETY, MEDICAL, FIRE)
- `status`: Alert status (ACTIVE, CANCELLED, RESOLVED, EXPIRED)
- `description`: Optional description of the emergency
- `cancelled_by_user`: Boolean flag
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `resolved_at`: Resolution timestamp

#### sos_responses Table
- `id`: Primary key
- `sos_alert_id`: Foreign key to sos_alerts table
- `responder_id`: Foreign key to users table
- `response_type`: Type of response (ON_WAY, CONTACTED_AUTHORITIES, REACHED, RESOLVED)
- `message`: Optional message from responder
- `points_awarded`: Points earned for this response
- `created_at`: Timestamp

#### users Table (Updated)
- Added `leaderboard_points`: Integer field to track total points earned

## Usage Instructions

### For Web Users

1. **Sending an SOS Alert**:
   - Look for the red "SOS" button in the bottom-right corner
   - Click the button to open the alert modal
   - Select the emergency type
   - Optionally add a description
   - Wait 15 seconds for auto-send or click "Send Now"
   - Click "Cancel" to abort the alert

2. **Viewing Active Alerts**:
   - Click "SOS Alerts" in the navigation sidebar
   - View all active alerts in your area
   - See distance, time, and emergency type for each alert
   - Click "Respond to Alert" to help

3. **Responding to Alerts**:
   - Select response type (On My Way, Contacted Authorities, etc.)
   - Add an optional message
   - Submit your response
   - Earn leaderboard points for helping!

### For Mobile Users

1. **Sending an SOS Alert**:
   - Tap the red "SOS" button (floating on the screen)
   - Allow location permissions if prompted
   - Select the emergency type from the list
   - Optionally add details
   - Wait 15 seconds or tap "Send Now"
   - Tap "Cancel" to abort

2. **Viewing Active Alerts**:
   - Tap the "SOS" tab in the bottom navigation
   - Pull down to refresh the list
   - View all active alerts with distance information
   - Tap "Respond to Alert" on any alert

3. **Responding to Alerts**:
   - Choose your response type
   - Add a message if needed
   - Tap "Submit"
   - Earn points for your contribution!

## Safety Considerations

1. **Location Privacy**: Location data is only shared when sending an SOS alert
2. **Timer Feature**: 15-second delay prevents accidental alerts
3. **Cancel Option**: Users can always cancel before the alert is sent
4. **Emergency Types**: Proper categorization helps responders understand the situation
5. **Community-Based**: Relies on community members while also alerting authorities

## Future Enhancements

Potential improvements for future versions:
- Integration with local emergency services APIs (911, police, ambulance)
- Push notifications for nearby users
- Audio/video call functionality for responders
- Emergency contacts notification
- Historical alert analytics
- Trust/verification system for responders
- Multi-language support
- Offline mode support
- Emergency resources directory

## Security Notes

- All endpoints require JWT authentication
- Location data is encrypted in transit
- User data is protected according to privacy policies
- Points system prevents gaming through response validation
- Rate limiting prevents spam alerts

## Testing

To test the SOS feature:
1. Create a test user account
2. Grant location permissions
3. Send a test alert from one account
4. View the alert from another account in the same area
5. Respond to the alert and verify points are awarded
6. Check the leaderboard to see updated rankings

## Support

For issues or questions about the SOS feature:
- Check the main README.md for setup instructions
- Review API documentation in API_TESTING.md
- Report bugs through the issue tracker
- Contact the development team for urgent concerns
