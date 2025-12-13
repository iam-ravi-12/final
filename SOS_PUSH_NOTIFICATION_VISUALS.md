# Push Notification Visual Examples

## Mobile Notification Display

### 1. Status Bar (Safe Area)
When a new SOS alert arrives, an icon appears in the status bar alongside network/battery icons:

```
┌─────────────────────────────────────────┐
│  12:34 PM    🚨  📶 📶 📶  🔋 85%  ●●  │  ← Status Bar (Safe Area)
└─────────────────────────────────────────┘
              ↑
           SOS Alert Icon
```

### 2. Notification Panel (Pull Down)
Swiping down from the status bar shows the full notification:

```
┌─────────────────────────────────────────┐
│ Notifications                            │
├─────────────────────────────────────────┤
│                                          │
│  🚨 Emergency                     now    │
│  Friend App                              │
│  John Doe needs help - 2.5 km away      │
│  ┌────────┐                              │
│  │ [VIEW] │                              │
│  └────────┘                              │
│                                          │
├─────────────────────────────────────────┤
│  Other notifications...                  │
└─────────────────────────────────────────┘
```

### 3. Lock Screen Display
Notifications appear even when phone is locked:

```
┌─────────────────────────────────────────┐
│                                          │
│             12:34 PM                     │
│          Friday, Dec 13                  │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ 🚨 Emergency              now      │ │
│  │ Friend App                         │ │
│  │ John Doe needs help - 2.5 km away │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │           🔓 UNLOCK                │ │
│  └────────────────────────────────────┘ │
│                                          │
└─────────────────────────────────────────┘
```

### 4. App Icon Badge
The app icon on home screen shows badge count:

```
┌─────────────────────────────────────────┐
│  Home Screen                             │
│                                          │
│    📱        📷        🎵        📧     │
│  Messages  Camera   Music    Email      │
│                                          │
│    🚨        📞        🌐        ⚙️     │
│  Friend    Phone    Browser  Settings   │
│   (3)                                    │
│    ↑                                     │
│   Badge showing 3 unread SOS alerts     │
│                                          │
└─────────────────────────────────────────┘
```

## Notification Variations by Emergency Type

### Immediate Emergency
```
┌────────────────────────────────────┐
│ 🚨 Immediate Emergency      now    │
│ Friend App                         │
│ Sarah needs help - 500 meters away │
└────────────────────────────────────┘
```

### Accident
```
┌────────────────────────────────────┐
│ 🚑 Accident                 now    │
│ Friend App                         │
│ Mike needs help - 1.2 km away     │
└────────────────────────────────────┘
```

### Women Safety
```
┌────────────────────────────────────┐
│ 👩 Women Safety             now    │
│ Friend App                         │
│ Emma needs help - nearby          │
└────────────────────────────────────┘
```

### Medical Emergency
```
┌────────────────────────────────────┐
│ ⚕️ Medical Emergency        now    │
│ Friend App                         │
│ David needs help - 3.8 km away    │
└────────────────────────────────────┘
```

### Fire
```
┌────────────────────────────────────┐
│ 🔥 Fire                     now    │
│ Friend App                         │
│ Lisa needs help - 750 meters away │
└────────────────────────────────────┘
```

## Notification Behavior Examples

### Example 1: Single Alert
```
Initial State:
┌─────────────────┐
│  🚨 Friend      │  ← No badge
│                 │
└─────────────────┘

Alert Created → Notification Arrives:
┌─────────────────┐
│  🚨 Friend      │
│   (1)           │  ← Badge appears
└─────────────────┘

Status Bar:
│ 12:34 PM  🚨  📶 🔋│  ← Icon in safe area
```

### Example 2: Multiple Alerts
```
3 alerts created:
┌─────────────────┐
│  🚨 Friend      │
│   (3)           │  ← Badge shows count
└─────────────────┘

Notification Panel:
┌────────────────────────────────────┐
│ 🚨 Emergency              now      │
│ Friend App                         │
│ John needs help - 2.5 km away     │
├────────────────────────────────────┤
│ 🚑 Accident               2m ago   │
│ Friend App                         │
│ Sarah needs help - 1 km away      │
├────────────────────────────────────┤
│ 👩 Women Safety           5m ago   │
│ Friend App                         │
│ Emma needs help - nearby          │
└────────────────────────────────────┘
```

### Example 3: User Taps Notification
```
Before Tap:
┌────────────────────────────────────┐
│ 🚨 Emergency              now      │
│ Friend App                         │
│ John needs help - 2.5 km away     │
└────────────────────────────────────┘

User Taps → App Opens:
┌─────────────────────────────────────┐
│ 🚨 Active SOS Alerts          [≡]   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🚨 Immediate Emergency          │ │
│ │ John Doe             Just now   │ │
│ │ "Need immediate help!"          │ │
│ │ 📍 2.5 km away                  │ │
│ │ 👥 3 responders                 │ │
│ │ [RESPOND TO ALERT]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🚑 Accident                     │ │
│ │ Sarah                 2m ago    │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Badge clears after viewing:
┌─────────────────┐
│  🚨 Friend      │  ← Badge removed
│                 │
└─────────────────┘
```

## Android vs iOS Display

### Android (Material Design)
```
┌────────────────────────────────────┐
│ 🚨 Emergency              now      │
│ Friend App                         │
│ John Doe needs help - 2.5 km away │
│ ┌────────┐  ┌─────────┐           │
│ │ VIEW   │  │ DISMISS │           │
│ └────────┘  └─────────┘           │
└────────────────────────────────────┘
  ↑ Red accent color
```

### iOS (Apple Design)
```
┌────────────────────────────────────┐
│ Friend App                  now    │
│ 🚨 Emergency                       │
│ John Doe needs help - 2.5 km away │
│                                    │
│ [Slide to view]                    │
└────────────────────────────────────┘
```

## Notification Priority Indicators

### Critical (MAX) Priority
```
┌────────────────────────────────────┐
│ ⚠️ URGENT                           │
│ 🚨 Emergency              now      │
│ Friend App                         │
│ John Doe needs help - 2.5 km away │
│                                    │
│ [Heads-up display - stays on top] │
└────────────────────────────────────┘
```

### With Vibration Pattern
```
Vibration: •-•-•-•
           ↑ ↑ ↑ ↑
           Short bursts (250ms each)
```

### LED Indicator (if available)
```
📱
┌─┐
│●│  ← Red LED flashing
└─┘
```

## User Interaction Flow

```
1. Alert Created
   ↓
2. Notification Arrives (within 30s)
   ┌────────────────────────────────────┐
   │ 🚨 Emergency              now      │
   │ Friend App                         │
   │ John needs help - 2.5 km away     │
   └────────────────────────────────────┘
   ↓
3. User Actions:
   
   a) Tap Notification → Opens App → View Alerts
   
   b) Swipe Away → Dismisses notification
                 → Badge still shows
   
   c) Ignore → Notification stays
             → Badge accumulates
   
   d) From App → Tap SOS Tab → Badge clears
                              → All notifications dismissed
```

## Do Not Disturb Bypass

```
Normal Mode:
│ 12:34 PM  🔔  📶 🔋│  ← Sounds enabled

DND Mode:
│ 12:34 PM  🔕  📶 🔋│  ← DND active

SOS Alert (bypasses DND):
│ 12:34 PM  🔕🚨  📶 🔋│  ← Still makes sound!
              ↑
         Notification shows despite DND
```

## Notification Settings

Users can control notifications via system settings:

```
┌─────────────────────────────────────┐
│ Settings > Apps > Friend            │
├─────────────────────────────────────┤
│ Notifications               [ON]    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ SOS Alerts                      │ │
│ │ Importance: Urgent (default)    │ │
│ │                                 │ │
│ │ ☑ Make sound                    │ │
│ │ ☑ Vibrate                       │ │
│ │ ☑ Pop on screen                 │ │
│ │ ☑ Show on lock screen          │ │
│ │ ☑ Override Do Not Disturb      │ │
│ │ ☐ Minimize (heads-up)           │ │
│ │ ☑ Show badge                    │ │
│ │                                 │ │
│ │ Sound: Default notification     │ │
│ │ Vibration: Default pattern      │ │
│ │ LED color: Red                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Summary

This implementation provides:

✅ **Status bar icons** in safe area (with network/battery)
✅ **Notification panel** entries with full details
✅ **Lock screen** visibility for immediate awareness
✅ **App badge** showing unread count
✅ **Critical priority** for maximum visibility
✅ **Sound + vibration** for alerting user
✅ **DND bypass** for emergency situations
✅ **LED indicators** on supported devices
✅ **Tap to open** app navigation
✅ **Auto-clear** when user views alerts

The notification experience matches or exceeds popular messaging apps while being specifically optimized for emergency alert scenarios.
