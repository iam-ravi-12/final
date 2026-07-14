# SOS Location Map Link Feature

## What Changed

Added a clickable map link in the admin panel's SOS Requests table to allow admins to view the exact location of SOS alerts on Google Maps.

## Visual Changes

### Before:
```
| Location                    |
|-----------------------------|
| 40.7128, -74.0060          |
```

### After:
```
| Location                    |
|-----------------------------|
| 📍 View on Map             |  <- Clickable link to Google Maps
| 40.7128, -74.0060          |  <- Coordinates shown below
```

## Features

1. **Clickable Map Link**: Each SOS request with coordinates now has a "📍 View on Map" link
2. **Opens Google Maps**: Link opens Google Maps in a new tab with the exact coordinates
3. **Shows Address**: If available, displays the location address below the link
4. **Fallback**: If no coordinates, shows the address or 'N/A'
5. **Styled Link**: Blue link with hover effect for better UX

## How It Works

When an admin clicks "📍 View on Map", it opens:
```
https://www.google.com/maps?q=LATITUDE,LONGITUDE
```

For example: `https://www.google.com/maps?q=40.7128,-74.0060`

This shows the exact location on Google Maps where the SOS alert was raised.

## Example Display

```
┌────────────────────────────────────────────────────┐
│ SOS Requests Table                                 │
├────┬──────┬──────────┬──────────┬─────────────────┤
│ ID │ User │ Type     │ Status   │ Location        │
├────┼──────┼──────────┼──────────┼─────────────────┤
│ 12 │ John │ MEDICAL  │ ACTIVE   │ 📍 View on Map │
│    │      │          │          │ New York, NY    │
├────┼──────┼──────────┼──────────┼─────────────────┤
│ 11 │ Jane │ FIRE     │ RESOLVED │ 📍 View on Map │
│    │      │          │          │ 34.05, -118.24  │
└────┴──────┴──────────┴──────────┴─────────────────┘
```

## Benefits

- **Quick Location Access**: Admins can instantly see where the SOS was raised
- **Better Context**: Understanding the location helps prioritize responses
- **Easy Navigation**: Opens directly in Google Maps for directions
- **Professional**: Clean UI with clear visual indicators

## Files Modified

1. **AdminDashboard.js**: Added map link logic in SOS table
2. **Admin.css**: Added `.map-link` styling

## Technical Details

- Uses target="_blank" to open in new tab
- Includes rel="noopener noreferrer" for security
- Only shows map link when latitude and longitude are available
- Falls back to address-only display when coordinates are missing
