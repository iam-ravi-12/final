# Professional Network Mobile App

A React Native mobile application built with Expo for the Professional Network platform. This app connects to the Spring Boot backend to provide a full-featured professional networking experience.

## Features

- **User Authentication**: Login and Signup with JWT tokens
- **Profile Management**: Users can set their profession and organization
- **Post Feed**: View posts in three sections:
  - All Posts: View all posts from all users
  - Professional Posts: View posts from users in the same profession
  - Help Section: Posts specifically marked for help or assistance
- **Create Posts**: Share content and request help
- **Messaging**: Direct messaging between users
- **Profile**: View and edit your profile

## Prerequisites

- Node.js 14 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Emulator (for Android development)
- Backend server running on port 8080

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure the backend API URL:

Edit `.env` file and set the `EXPO_PUBLIC_API_URL`:
- For iOS Simulator: `http://localhost:8080`
- For Android Emulator: `http://10.0.2.2:8080`
- For physical device: `http://YOUR_COMPUTER_IP:8080`

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your physical device

## Project Structure

```
friend/
├── app/                    # App routes (using Expo Router)
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home/Feed screen
│   │   ├── messages.tsx   # Messages list screen
│   │   └── profile.tsx    # Profile screen
│   ├── _layout.tsx        # Root layout with auth handling
│   ├── login.tsx          # Login screen
│   ├── signup.tsx         # Signup screen
│   ├── profile-setup.tsx  # Profile setup screen
│   └── create-post.tsx    # Create post modal
├── screens/               # Screen components
├── services/              # API services
│   ├── api.ts            # Axios configuration
│   ├── authService.ts    # Authentication API calls
│   ├── postService.ts    # Post API calls
│   ├── messageService.ts # Message API calls
│   └── followService.ts  # Follow API calls
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
├── components/            # Reusable components
└── constants/             # App constants
```

## Tech Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tooling
- **Expo Router**: File-based routing
- **TypeScript**: Type-safe development
- **Axios**: HTTP client
- **AsyncStorage**: Local data persistence

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Backend Integration

This app connects to the Professional Network backend API. Make sure the backend is running before using the app.

### API Endpoints Used

- `/api/auth/signup` - User registration
- `/api/auth/login` - User login
- `/api/auth/profile` - Get/Update user profile
- `/api/posts` - CRUD operations for posts
- `/api/posts/all` - Get all posts
- `/api/posts/profession` - Get posts by profession
- `/api/posts/help` - Get help posts
- `/api/messages` - Messaging endpoints
- `/api/follows` - Follow/unfollow operations

## Troubleshooting

### Cannot connect to backend

- Make sure the backend is running on port 8080
- Check the `EXPO_PUBLIC_API_URL` in `.env` file
- For physical devices, ensure they're on the same network as your computer
- For Android emulator, use `10.0.2.2` instead of `localhost`

### App crashes on startup

- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## License

This project is licensed under the MIT License.
