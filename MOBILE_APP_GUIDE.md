# React Native App Integration Guide

This guide explains how to connect and use the React Native mobile app (`friend` folder) with the Spring Boot backend.

## Overview

The `friend` folder contains a React Native mobile application built with Expo that connects to the Professional Network backend API. The app provides a native mobile experience for Android and iOS devices.

## Architecture

```
┌─────────────────────────────────────┐
│   React Native App (Expo)          │
│   - Authentication                  │
│   - Post Feed (All/Pro/Help)        │
│   - Create Posts                    │
│   - Messaging                       │
│   - Profile Management              │
└──────────────┬──────────────────────┘
               │
               │ HTTP/REST API
               │ (JWT Authentication)
               │
┌──────────────▼──────────────────────┐
│   Spring Boot Backend (Port 8080)  │
│   - REST Controllers                │
│   - JWT Security                    │
│   - JPA/Hibernate                   │
└──────────────┬──────────────────────┘
               │
               │ JDBC
               │
┌──────────────▼──────────────────────┐
│   MySQL Database                    │
│   - Users, Posts, Messages          │
│   - Follows, Comments               │
└─────────────────────────────────────┘
```

## Prerequisites

### Backend Setup
1. MySQL 8.0 or higher installed and running
2. Java 17 installed
3. Maven installed
4. Backend running on port 8080

### Mobile App Setup
1. Node.js 14 or higher
2. npm or yarn
3. Expo CLI: `npm install -g expo-cli`
4. For iOS: Xcode and iOS Simulator (macOS only)
5. For Android: Android Studio and Android Emulator
6. For physical devices: Expo Go app

## Step-by-Step Setup

### 1. Start the Backend

From the project root directory:

```bash
# Configure database
mysql -u root -p
CREATE DATABASE professional_network;
exit

# Start Spring Boot backend
mvn spring-boot:run
```

Verify backend is running:
```bash
curl http://localhost:8080/api/auth/signup
# Should return a method not allowed or similar (endpoint exists but requires POST)
```

### 2. Configure the Mobile App

Navigate to the friend directory:
```bash
cd friend
```

Install dependencies:
```bash
npm install
```

Configure API URL by creating a `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and set the appropriate URL:
- **iOS Simulator**: `EXPO_PUBLIC_API_URL=http://localhost:8080`
- **Android Emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080`
- **Physical Device**: `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8080`

To find your computer's IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### 3. Start the Mobile App

```bash
npm start
```

This will open Expo DevTools in your browser.

#### Run on iOS Simulator (macOS only):
Press `i` in the terminal or click "Run on iOS simulator" in DevTools

#### Run on Android Emulator:
1. Start Android emulator first
2. Press `a` in the terminal or click "Run on Android device/emulator"

#### Run on Physical Device:
1. Install Expo Go app from App Store (iOS) or Play Store (Android)
2. Make sure device is on the same WiFi network as your computer
3. Scan QR code with Expo Go app

## Using the App

### First Time Setup

1. **Sign Up**
   - Open the app
   - Tap "Don't have an account? Sign Up"
   - Enter username, email, and password
   - Tap "Sign Up"

2. **Complete Profile**
   - After signup, you'll be prompted to complete your profile
   - Enter your profession (e.g., "Software Engineer")
   - Enter your organization (e.g., "Tech Corp")
   - Tap "Complete Profile"

3. **Explore the App**
   - **Home Tab**: View posts in three sections (All, Professional, Help)
   - **Messages Tab**: View and send messages
   - **Profile Tab**: View and edit your profile

### Creating Posts

1. Tap the "+" icon in the header on the Home screen
2. Enter your post content
3. Toggle "Mark as Help Request" if you need help
4. Tap "Post"

### Viewing Posts

- **All Posts**: Shows all posts from all users
- **Professional**: Shows posts from users with the same profession as you
- **Help**: Shows posts marked as help requests

### Messaging

1. Go to Messages tab
2. View all conversations
3. Tap on a conversation to open the chat
4. Type and send messages

### Like and Comment

1. Tap the heart icon to like a post
2. Tap the comment icon to view comments
3. Add your own comment

## Troubleshooting

### Cannot connect to backend

**Issue**: "Network request failed" or "Cannot connect to server"

**Solutions**:
1. Verify backend is running: `curl http://localhost:8080`
2. Check `.env` file has correct `EXPO_PUBLIC_API_URL`
3. For Android emulator, use `http://10.0.2.2:8080` (not localhost)
4. For physical device:
   - Ensure device is on same WiFi as computer
   - Use your computer's IP address (not localhost)
   - Disable any firewall blocking port 8080

### App crashes on startup

**Solutions**:
1. Clear Expo cache: `expo start -c`
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```
3. Check for TypeScript errors: `npx tsc --noEmit`

### Authentication errors

**Issue**: "401 Unauthorized" or "Token expired"

**Solutions**:
1. Clear app data and login again
2. Check backend logs for JWT errors
3. Verify JWT secret is configured in backend `application.properties`

### Database connection errors

**Issue**: Backend shows database connection errors

**Solutions**:
1. Verify MySQL is running: `mysql -u root -p`
2. Check database exists: `SHOW DATABASES;`
3. Verify credentials in `application.properties`
4. Check database URL in `application.properties`

## API Endpoints Used

The mobile app uses these backend endpoints:

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/profile` - Update user profile
- `GET /api/auth/profile/{userId}` - Get user by ID

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/all` - Get all posts
- `GET /api/posts/profession` - Get posts by profession
- `GET /api/posts/help` - Get help posts
- `POST /api/posts/{postId}/like` - Toggle like
- `POST /api/posts/{postId}/comments` - Add comment
- `GET /api/posts/{postId}/comments` - Get comments

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get conversations list
- `GET /api/messages/with/{userId}` - Get messages with user
- `PUT /api/messages/read/{userId}` - Mark messages as read

### Follows
- `POST /api/follows/send/{userId}` - Send follow request
- `GET /api/follows/stats/{userId}` - Get follow statistics

## Development Tips

### Hot Reload
Changes to code will automatically reload in the app when using Expo.

### Debugging
1. Shake device or press Cmd+D (iOS) / Cmd+M (Android) to open dev menu
2. Select "Debug Remote JS" to use Chrome DevTools
3. Check Console for errors

### Testing on Multiple Devices
You can run the app on multiple simulators/devices simultaneously by scanning the same QR code.

### Environment Variables
- Never commit `.env` file (it's in `.gitignore`)
- Use `.env.example` as a template
- Each developer should create their own `.env` file

## Production Deployment

For production deployment:

1. Update `EXPO_PUBLIC_API_URL` to production backend URL
2. Build the app:
   ```bash
   # For iOS
   expo build:ios
   
   # For Android
   expo build:android
   ```
3. Follow Expo's deployment guides for app stores

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Spring Boot Backend README](../README.md)
- [API Testing Guide](../API_TESTING.md)

## Support

If you encounter issues:
1. Check backend logs: `tail -f logs/application.log`
2. Check Expo DevTools console
3. Verify all prerequisites are installed
4. Ensure backend and database are running
5. Check network connectivity between app and backend
