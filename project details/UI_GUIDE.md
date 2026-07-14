# User Interface Guide

This document describes the user interface of the Professional Network application.

## Color Scheme

The application uses a modern, professional color palette:
- **Primary Gradient**: Purple (#667eea) to Violet (#764ba2)
- **Background**: Light gray (#f5f5f5)
- **Cards**: White (#ffffff)
- **Text**: Dark gray (#333) for primary, medium gray (#666) for secondary
- **Error**: Red (#c33) with light pink background (#fee)
- **Help Badge**: Red (#ff6b6b)

## Page-by-Page Overview

### 1. Login Page (`/login`)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [Purple Gradient Background]            │
│                                                 │
│     ┌───────────────────────────────────┐      │
│     │   Professional Network             │      │
│     │                                     │      │
│     │   Login                             │      │
│     │                                     │      │
│     │   ┌─────────────────────────┐      │      │
│     │   │ Username                │      │      │
│     │   │ [________________]      │      │      │
│     │   └─────────────────────────┘      │      │
│     │                                     │      │
│     │   ┌─────────────────────────┐      │      │
│     │   │ Password                │      │      │
│     │   │ [________________]      │      │      │
│     │   └─────────────────────────┘      │      │
│     │                                     │      │
│     │   ┌─────────────────────────┐      │      │
│     │   │       Login             │      │      │
│     │   └─────────────────────────┘      │      │
│     │                                     │      │
│     │   Don't have an account? Sign up   │      │
│     └───────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features:**
- Centered white card on gradient background
- Input fields with focus states (border turns purple)
- Full-width purple gradient button
- Link to signup page
- Error messages appear above the form

### 2. Signup Page (`/signup`)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [Purple Gradient Background]            │
│                                                 │
│     ┌───────────────────────────────────┐      │
│     │   Professional Network             │      │
│     │                                     │      │
│     │   Sign Up                           │      │
│     │                                     │      │
│     │   Username    [________________]   │      │
│     │   Email       [________________]   │      │
│     │   Password    [________________]   │      │
│     │   Confirm     [________________]   │      │
│     │                                     │      │
│     │   [      Sign Up      ]            │      │
│     │                                     │      │
│     │   Already have an account? Login   │      │
│     └───────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features:**
- Similar to login page with more fields
- Password confirmation validation
- Input validation (email format, password length)
- Link to login page

### 3. Profile Setup Page (`/profile-setup`)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [Purple Gradient Background]            │
│                                                 │
│     ┌───────────────────────────────────┐      │
│     │   Complete Your Profile            │      │
│     │   Please provide your professional │      │
│     │   details                           │      │
│     │                                     │      │
│     │   ┌─────────────────────────┐      │      │
│     │   │ Profession              │      │      │
│     │   │ e.g., Software Engineer │      │      │
│     │   └─────────────────────────┘      │      │
│     │                                     │      │
│     │   ┌─────────────────────────┐      │      │
│     │   │ Organization            │      │      │
│     │   │ e.g., Tech Corp         │      │      │
│     │   └─────────────────────────┘      │      │
│     │                                     │      │
│     │   [  Complete Profile  ]           │      │
│     └───────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features:**
- Accessed after signup or login (if profile incomplete)
- Two required fields: profession and organization
- Cannot be skipped (required for full app access)

### 4. Home Page / Dashboard (`/home`)

**Header:**
```
┌─────────────────────────────────────────────────┐
│  Professional Network          john_doe  Logout │
└─────────────────────────────────────────────────┘
```

**Main Content:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  All Posts  │ Professional │ Help Section │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         + Create Post                     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  ●  john_doe                    2h ago    │ │
│  │     Software Engineer                     │ │
│  │                                            │ │
│  │  This is my first post! Excited to       │ │
│  │  connect with professionals.              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  ●  jane_smith                  5h ago    │ │
│  │     Product Manager                       │ │
│  │                                            │ │
│  │  Looking for best practices in agile     │ │
│  │  development.                             │ │
│  │                           [Help Request]  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features:**
- Purple gradient header with username and logout button
- Three tab navigation (active tab has gradient background)
- Create post button (full width, gradient)
- Post cards with:
  - Avatar (first letter of username in gradient circle)
  - Username and profession
  - Timestamp (relative: "2h ago", "5h ago")
  - Post content
  - Optional "Help Request" badge (red)
- Hover effects on cards (shadow increases)

### 5. Create Post Form (Expanded)

When "+ Create Post" is clicked:
```
┌───────────────────────────────────────────┐
│  Create a Post                            │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │                                       │ │
│  │  What's on your mind?                │ │
│  │                                       │ │
│  │                                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  □ Mark as Help Request                   │
│                                            │
│  [Cancel]              [Post]             │
└───────────────────────────────────────────┘
```

**Features:**
- White card with shadow
- Multi-line textarea
- Checkbox for help requests
- Cancel and Post buttons
- Post button has gradient background

## Responsive Design

### Desktop (>768px)
- Maximum content width: 1200px (header), 800px (main content)
- Tabs display horizontally
- Posts display as cards with full width

### Mobile (<768px)
- Header stacks: logo on top, user info below
- Tabs stack vertically
- Full-width cards
- Touch-friendly button sizes

## Interactive Elements

### Buttons

**Primary Button (Gradient):**
- Normal: Purple-violet gradient
- Hover: Lifts up 2px, adds shadow
- Active: Returns to original position
- Disabled: 60% opacity, no hover effects

**Secondary Button (Outlined):**
- Normal: White with purple border
- Hover: Light gray background
- Used for: Cancel actions

### Input Fields
- Normal: Light gray border
- Focus: Purple border, no outline
- Error: Red border
- Disabled: Gray background, cursor not-allowed

### Tabs
- Inactive: White background, gray text
- Active: Gradient background, white text
- Hover (inactive): Light gray background

### Post Cards
- Normal: White with subtle shadow
- Hover: Increased shadow (elevation effect)

## Animations and Transitions

All transitions use 0.3s duration for smooth feel:
- Button hover effects
- Card shadows
- Tab switching
- Border color changes

## Error States

### Form Errors
```
┌───────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐ │
│  │ ⚠ Passwords do not match           │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Password    [________________]          │
│  Confirm     [________________]          │
└───────────────────────────────────────────┘
```
- Red background with dark red text
- Left border emphasis
- Appears above form fields

### Loading States
```
┌───────────────────────────────────────────┐
│                                           │
│         Loading posts...                  │
│                                           │
└───────────────────────────────────────────┘
```
- Centered text
- Gray color
- Appears while fetching data

### Empty States
```
┌───────────────────────────────────────────┐
│                                           │
│   No posts yet. Be the first to         │
│   create one!                            │
│                                           │
└───────────────────────────────────────────┘
```
- Centered message
- Light gray text
- Friendly, encouraging tone

## Accessibility Features

- Semantic HTML elements (header, nav, main, article)
- Proper form labels
- Keyboard navigation support
- Focus indicators on interactive elements
- ARIA labels where needed
- Color contrast meets WCAG AA standards

## Visual Hierarchy

1. **Primary**: Gradient buttons, active tabs, header
2. **Secondary**: Post content, usernames
3. **Tertiary**: Timestamps, metadata, subtle borders

## Typography

- **Headings**: Bold, larger size
- **Body**: System font stack (optimized for each OS)
- **Metadata**: Smaller, lighter weight
- Font sizes: 28px (h1), 24px (h2), 20px (h3), 16px (body), 14px (small)

## Spacing

Consistent spacing using multiples of 4px:
- Small: 8px, 12px
- Medium: 16px, 20px, 24px
- Large: 30px, 40px
- Extra large: 60px (empty states)

## Card Design

All cards follow the same pattern:
- White background
- 12px border radius
- Box shadow: `0 2px 8px rgba(0, 0, 0, 0.1)`
- Padding: 20-24px
- Hover shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`

## User Feedback

### Success Actions
- Login/Signup: Redirect to next page
- Post created: Refresh feed, close form
- Profile updated: Redirect to home

### Error Actions
- Show error message in red card
- Keep user on current page
- Error message auto-focuses

### Loading Actions
- Button shows "Loading..." text
- Button disabled during operation
- Prevents double submissions

## Best Practices Implemented

✅ Consistent color scheme  
✅ Clear visual hierarchy  
✅ Responsive design  
✅ Smooth animations  
✅ Clear error states  
✅ Loading indicators  
✅ Empty state messages  
✅ Accessible interface  
✅ Mobile-friendly  
✅ Professional appearance  

## Design Inspiration

The design is inspired by modern SaaS applications with:
- Clean, minimal interface
- Professional color scheme
- Card-based layouts
- Gradient accents
- Smooth interactions
- Clear typography
- Generous white space

This creates a professional, trustworthy appearance suitable for a professional networking platform.
