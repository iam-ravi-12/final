# Admin Panel Visual Guide

## Admin Login Page

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              🔐 Admin Panel                     │
│                   Login                         │
│                                                 │
│   ┌─────────────────────────────────────┐      │
│   │ Admin ID                            │      │
│   │ [Enter admin ID               ]    │      │
│   └─────────────────────────────────────┘      │
│                                                 │
│   ┌─────────────────────────────────────┐      │
│   │ Password                            │      │
│   │ [Enter admin password        ]     │      │
│   └─────────────────────────────────────┘      │
│                                                 │
│        [ Login as Admin ]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Admin Dashboard - Overview

```
┌────────────────────────────────────────────────────────────────────┐
│  Admin Panel                                    [ Logout ]          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Total   │  │  Total   │  │  Total   │  │  Total   │         │
│  │  Users   │  │  Posts   │  │Communities│  │   SOS    │         │
│  │   150    │  │   450    │  │    25    │  │   Requests│         │
│  │          │  │          │  │          │  │    38     │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  [ Users ]  [ Communities ]  [ SOS Requests ]                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Users Tab Active                                                 │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ ID │ Username │ Name │ Email │ Profession │ Points │... │    │
│  ├────┼──────────┼──────┼───────┼────────────┼────────┼────┤    │
│  │ 1  │ john_doe │ John │ j@... │ Engineer   │  150   │... │    │
│  │ 2  │ jane_sm  │ Jane │ jane@ │ Doctor     │  230   │... │    │
│  │ 3  │ bob_wilson│ Bob │ bob@  │ Teacher    │   80   │... │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Communities Tab

```
┌────────────────────────────────────────────────────────────────────┐
│  Admin Panel                                    [ Logout ]          │
├────────────────────────────────────────────────────────────────────┤
│  [ Users ]  [Communities]  [ SOS Requests ]                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  All Communities (25)                                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ ID │ Name │ Description │ Admin │ Privacy │ Members │ Actions│  │
│  ├────┼──────┼─────────────┼───────┼─────────┼─────────┼────────│  │
│  │ 1  │ Tech │ Tech comm.  │ John  │ Public  │   45    │[View] │  │
│  │ 2  │ Health│ Health grp │ Jane  │ Private │   23    │[View] │  │
│  │ 3  │ Sports│ Sports fans│ Bob   │ Public  │   67    │[View] │  │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

When "View" is clicked:
┌──────────────────────────────────────┐
│  Members of Tech Community      [ × ]│
├──────────────────────────────────────┤
│  User ID │ Username │ Name │ Joined │
│  ────────┼──────────┼──────┼────────│
│    5     │ alice_k  │Alice │ 1/2/24 │
│    8     │ charlie  │Chuck │ 2/5/24 │
│   12     │ diana_m  │Diana │ 3/1/24 │
└──────────────────────────────────────┘
```

## SOS Requests Tab

```
┌────────────────────────────────────────────────────────────────────┐
│  Admin Panel                                    [ Logout ]          │
├────────────────────────────────────────────────────────────────────┤
│  [ Users ]  [ Communities ]  [SOS Requests]                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  All SOS Requests (38)                                             │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ ID │ User │ Type │ Status │ Location │ Responses │ Actions │   │
│  ├────┼──────┼──────┼────────┼──────────┼───────────┼─────────│   │
│  │ 12 │John D│MEDICAL│[ACTIVE]│NYC       │    3      │ [View] │   │
│  │ 11 │Sarah │FIRE  │[RESOLVED]│LA       │    5      │ [View] │   │
│  │ 10 │Mike  │EMERGENCY│[CANCELLED]│SF   │    1      │ [View] │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

When "View" is clicked:
┌───────────────────────────────────────────────┐
│  Responses to SOS #12                    [ × ]│
├───────────────────────────────────────────────┤
│  Responder │ Type │ Message │ Points │ Time  │
│  ──────────┼──────┼─────────┼────────┼───────│
│  Alice K.  │ON_WAY│"Coming" │   10   │10:30 │
│  Bob Smith │CONTACTED│"911"  │   20   │10:32 │
│  Jane Doe  │REACHED│"Here"  │   50   │10:45 │
└───────────────────────────────────────────────┘
```

## Color Coding

### Status Badges
- **ACTIVE**: Green background (#d4edda) with dark green text
- **CANCELLED**: Red background (#f8d7da) with dark red text
- **RESOLVED**: Blue background (#d1ecf1) with dark blue text
- **EXPIRED**: Gray background (#e2e3e5) with dark gray text

### UI Elements
- **Primary Button**: Blue (#007bff)
- **Logout Button**: Red (#dc3545)
- **Stat Cards**: White with blue numbers
- **Active Tab**: Blue background with white text
- **Inactive Tab**: Light gray background

## Responsive Design

### Desktop View (1400px+)
- 4 stat cards in a row
- Full-width tables with all columns visible
- Large modals (900px max-width)

### Tablet View (768px - 1400px)
- 2 stat cards per row
- Horizontal scrolling for wide tables
- Medium modals (90% width)

### Mobile View (<768px)
- 1 stat card per row
- Stacked tabs
- Horizontal scrolling for tables
- Full-width modals (95% width)
- Smaller fonts and padding
