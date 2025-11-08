# Modern Home Page Visual Mockup

## New Design Layout

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    PROFESSIONAL NETWORK - MODERN HOME PAGE                        ║
╠════════════════╦═════════════════════════════════════════════════════════════════╣
║                ║                                                                   ║
║  [LOGO TEXT]   ║            [CREATE POST CARD]                                   ║
║  Professional  ║   ┌────────────────────────────────────────────────┐            ║
║   Network      ║   │  👤 What's on your mind, Username?             │            ║
║                ║   └────────────────────────────────────────────────┘            ║
║ ┌────────────┐ ║                                                                   ║
║ │ 🏠  Home   │ ║   ┌──────────────────────────────────────────────────────┐      ║
║ └────────────┘ ║   │  👤 John Doe                                          │      ║
║                ║   │  Software Engineer                                    │      ║
║ ┌────────────┐ ║   │                                                       │      ║
║ │ 💼  Prof   │ ║   │  Just deployed a new feature! The modern UI looks    │      ║
║ └────────────┘ ║   │  amazing with the sidebar navigation. 🚀              │      ║
║                ║   │                                                       │      ║
║ ┌────────────┐ ║   │  👍 15  💬 3  🔗 2                                    │      ║
║ │ 🆘  Help   │ ║   └──────────────────────────────────────────────────────┘      ║
║ └────────────┘ ║                                                                   ║
║                ║   ┌──────────────────────────────────────────────────────┐      ║
║ ┌────────────┐ ║   │  👤 Sarah Miller                                     │      ║
║ │ 💬  Msgs   │ ║   │  Product Designer                                    │      ║
║ └────────────┘ ║   │                                                       │      ║
║                ║   │  Looking for feedback on this new design pattern.    │      ║
║ ┌────────────┐ ║   │  What do you think about the color scheme?           │      ║
║ │ 👤  Prof   │ ║   │                                                       │      ║
║ └────────────┘ ║   │  👍 8  💬 5  🔗 1                                     │      ║
║                ║   └──────────────────────────────────────────────────────┘      ║
║                ║                                                                   ║
║                ║   ┌──────────────────────────────────────────────────────┐      ║
║ ┌────────────┐ ║   │  👤 Alex Chen                                        │      ║
║ │  👤        │ ║   │  Full Stack Developer                                │      ║
║ │  Username  │ ║   │                                                       │      ║
║ │  Title     │ ║   │  Anyone experienced with React hooks? Need help      │      ║
║ └────────────┘ ║   │  with a custom hook implementation.                  │      ║
║                ║   │                                                       │      ║
║  [🚪 Logout]  ║   │  👍 12  💬 7  🔗 3                                    │      ║
║                ║   └──────────────────────────────────────────────────────┘      ║
║                ║                                                                   ║
╚════════════════╩═════════════════════════════════════════════════════════════════╝

     280px             Main Feed Area (max-width: 680px, centered)
    Sidebar
```

## Key Visual Elements

### Sidebar (Left - 280px Fixed)
- **Background**: White with subtle border
- **Logo**: Gradient text (indigo to purple)
- **Navigation Items**:
  - Active: Gradient background with white text + shadow
  - Inactive: Light gray background with medium gray text
  - Hover: Slight translation to right (4px)
- **Icons**: Large emoji icons (22px)
- **User Card**: 
  - Avatar circle with gradient or image
  - Username in bold
  - Profession/title in lighter text
- **Logout Button**: 
  - White background with border
  - Hover: Red background and text

### Main Feed (Center - Max 680px)
- **Background**: Light gray (#f5f7fa)
- **Create Post Card**:
  - White rounded card (16px radius)
  - User avatar + placeholder text
  - Subtle border and shadow
  - Expands on click
- **Post Cards**:
  - White background with 16px border radius
  - 1px border (#e5e7eb)
  - Subtle shadow (0 1px 3px rgba)
  - 16px gap between cards
  - **Post Header**:
    - 52px avatar circle
    - Username in bold (#1f2937)
    - Profession in brand color (#6366f1)
  - **Post Content**: 
    - Clean typography
    - Good line height (1.7)
  - **Actions**: 
    - Like, Comment, Share buttons
    - Hover effects

### Color Scheme
- **Primary**: #6366f1 (Indigo)
- **Secondary**: #a855f7 (Purple)
- **Background**: #f5f7fa (Light Gray)
- **Cards**: White (#ffffff)
- **Borders**: #e5e7eb (Light Gray)
- **Text Dark**: #1f2937
- **Text Medium**: #6b7280
- **Text Light**: #9ca3af

### Spacing
- **Sidebar Padding**: 16-24px
- **Nav Item Padding**: 14px vertical, 16px horizontal
- **Card Padding**: 20-24px
- **Gap Between Posts**: 16px
- **Content Max Width**: 680px

### Typography (Inter Font)
- **Logo**: 24px, weight 800
- **Nav Items**: 16px, weight 600
- **Post Username**: 17px, weight 700
- **Post Content**: 15px, weight 400
- **Small Text**: 13-14px

### Animations
- **Sidebar Slide In**: 0.4s ease-out from left
- **Content Fade In**: 0.5s ease-out
- **Cards Scale In**: 0.3-0.4s ease-out
- **Nav Hover**: Translate X 4px in 0.3s
- **Loading Spinner**: Continuous rotation

### States
- **Loading**: Spinner with pulsing animation
- **Empty**: Large emoji + encouraging message
- **Error**: Red gradient background with message
- **Hover**: Smooth transitions and transformations

## Mobile Responsive (<768px)
- Sidebar slides out (transform: translateX(-100%))
- Main content takes full width
- Reduced padding (16px)
- Stacked layout
- Touch-optimized spacing
