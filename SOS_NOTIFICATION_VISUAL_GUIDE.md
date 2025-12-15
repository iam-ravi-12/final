# Visual Guide: SOS Notification Badge

## Web Application (React)

### Navigation Sidebar - Before (No Notifications)
```
┌─────────────────────┐
│ Friends             │
│ A social Network    │
├─────────────────────┤
│ 🏠 Home             │
│ 💼 Professional     │
│ 🆘 Help             │
│ 👥 Communities      │
│ 💬 Messages         │
│ 👤 Profile          │
│ 🚨 SOS Alerts       │  ← No badge
│ 🏆 Leaderboard      │
└─────────────────────┘
```

### Navigation Sidebar - After (With Notifications)
```
┌─────────────────────┐
│ Friends             │
│ A social Network    │
├─────────────────────┤
│ 🏠 Home             │
│ 💼 Professional     │
│ 🆘 Help             │
│ 👥 Communities      │
│ 💬 Messages         │
│ 👤 Profile          │
│ 🚨 SOS Alerts  [5]  │  ← Red badge with count
│ 🏆 Leaderboard      │
└─────────────────────┘
```

### CSS Implementation
```css
.notification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;          /* Red background */
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.9; }
}
```

## Mobile Application (React Native)

### Bottom Tab Bar - Before (No Notifications)
```
┌───────────────────────────────────────────┐
│                                           │
│         [App Content Area]                │
│                                           │
├───────────────────────────────────────────┤
│  🏠     👥     💬     🚨     🏆     👤  │
│ Home  Comm  Messages SOS  Leader Profile │
│                           ↑               │
│                    No notification        │
└───────────────────────────────────────────┘
```

### Bottom Tab Bar - After (With Notifications)
```
┌───────────────────────────────────────────┐
│                                           │
│         [App Content Area]                │
│                                           │
├───────────────────────────────────────────┤
│  🏠     👥     💬     🚨     🏆     👤  │
│ Home  Comm  Messages SOS  Leader Profile │
│                       ●                   │
│                       5  ← Red badge      │
└───────────────────────────────────────────┘
```

### React Native Implementation
```tsx
<View>
  <IconSymbol size={28} name="exclamationmark.triangle.fill" color={color} />
  {sosUnreadCount > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {sosUnreadCount > 99 ? '99+' : sosUnreadCount}
      </Text>
    </View>
  )}
</View>
```

## Notification States

### State 1: Initial Load (User Never Checked)
```
User Login → Check lastSosCheckAt → null
  ↓
Count ALL active valid alerts (excluding user's own)
  ↓
Display badge: [8]
```

### State 2: After Viewing Alerts
```
User clicks SOS Alerts → markAlertsAsRead() called
  ↓
Set lastSosCheckAt = NOW
  ↓
Badge disappears: [ ]
```

### State 3: New Alert Created
```
Another user creates SOS alert
  ↓
Polling checks every 30 seconds
  ↓
New alert detected (created_at > lastSosCheckAt)
  ↓
Badge reappears: [1]
```

### State 4: Multiple New Alerts
```
3 new alerts created while user browses
  ↓
Next poll cycle (within 30 seconds)
  ↓
Count = 3 alerts with created_at > lastSosCheckAt
  ↓
Badge updates: [3]
```

## User Flow Diagram

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Load Home Page │◄──────────┐
└────────┬────────┘           │
         │                    │
         ▼                    │
┌─────────────────┐           │
│ Fetch Unread    │           │
│    Count API    │           │
└────────┬────────┘           │
         │                    │
         ▼                    │
    ┌────────┐                │
    │Count>0?│────No─────────►│
    └───┬────┘                │
        │                     │
       Yes                    │
        │                     │
        ▼                     │
┌─────────────────┐           │
│  Display Badge  │           │
│      [5]        │           │
└────────┬────────┘           │
         │                    │
         │                    │
    User clicks                │
    SOS Alerts                 │
         │                    │
         ▼                    │
┌─────────────────┐           │
│ View SOS Alerts │           │
│      Page       │           │
└────────┬────────┘           │
         │                    │
         ▼                    │
┌─────────────────┐           │
│ markAlertsRead()│           │
└────────┬────────┘           │
         │                    │
         ▼                    │
┌─────────────────┐           │
│  Badge Hidden   │           │
└────────┬────────┘           │
         │                    │
         │  Poll every 30s    │
         └────────────────────┘
```

## Badge Appearance Examples

### Low Count (1-9)
```
Web:   🚨 SOS Alerts [3]
Mobile: 🚨 with small circle "3"
```

### Medium Count (10-99)
```
Web:   🚨 SOS Alerts [42]
Mobile: 🚨 with circle "42"
```

### High Count (100+)
```
Web:   🚨 SOS Alerts [99+]
Mobile: 🚨 with circle "99+"
```

## Animation Effect

The badge includes a subtle pulse animation to draw user's attention:

```
Frame 1 (0s):   [5]  ← Normal size, full opacity
Frame 2 (1s):   [5]  ← Slightly larger, slightly transparent
Frame 3 (2s):   [5]  ← Back to normal
Repeat...
```

This creates a gentle "breathing" effect that catches the eye without being distracting.

## Color Scheme

```
Badge Background: #ef4444 (Red-500)
Badge Text:       #ffffff (White)
Badge Border:     None (clean design)

Pulse Animation:
  - Scale: 1.0 → 1.1 → 1.0
  - Opacity: 1.0 → 0.9 → 1.0
```

## Accessibility

- High contrast (red on white text)
- Large enough for easy reading (11px font)
- Animation is subtle enough not to cause issues
- Screen readers will announce count changes
- Badge is positioned consistently across platforms

## Responsive Design

### Desktop (Large Screen)
```
Full sidebar visible with badge clearly displayed
```

### Tablet (Medium Screen)
```
Sidebar may collapse, badge still visible on icon
```

### Mobile Web (Small Screen)
```
Hamburger menu, badge shows on menu icon
```

## Dark Mode Support

While not implemented in current version, the design supports dark mode:

```css
/* Light Mode */
.notification-badge {
  background: #ef4444;  /* Red */
  color: white;
}

/* Dark Mode (Future) */
.dark-mode .notification-badge {
  background: #dc2626;  /* Darker red */
  color: white;
}
```

## Performance Impact

### Network
- 1 API call every 30 seconds
- Payload: ~50 bytes (JSON: {"count": 5})
- Bandwidth: ~100 bytes/minute per user

### CPU
- Minimal: Simple counter update
- Animation: CSS-based (GPU accelerated)

### Memory
- State variable: 4-8 bytes
- Total: < 1KB additional memory

## Browser/Platform Compatibility

✅ Chrome/Edge (Web)
✅ Firefox (Web)
✅ Safari (Web)
✅ iOS (React Native)
✅ Android (React Native)

---

This visual guide demonstrates the notification badge implementation across both web and mobile platforms, showing how users will experience the new feature.
