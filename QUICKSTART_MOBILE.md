# Quick Start Guide - Professional Network Mobile App

This guide will help you quickly set up and run the React Native mobile app with the backend.

## Prerequisites Checklist

- [ ] Java 17 installed
- [ ] MySQL 8.0+ installed and running
- [ ] Node.js 14+ installed
- [ ] Maven installed
- [ ] Expo CLI installed: `npm install -g expo-cli`

## 5-Minute Setup

### Step 1: Start MySQL Database (1 minute)
```bash
# Start MySQL
mysql.server start  # macOS
# OR
sudo service mysql start  # Linux

# Create database
mysql -u root -p
CREATE DATABASE professional_network;
exit
```

### Step 2: Start Backend (2 minutes)
```bash
# From project root
mvn spring-boot:run
```

Wait for: `Started ProfessionalNetworkApplication in X seconds`

### Step 3: Configure Mobile App (1 minute)
```bash
cd friend
cp .env.example .env
npm install
```

Edit `.env`:
- **iOS Simulator**: Use `http://localhost:8080`
- **Android Emulator**: Use `http://10.0.2.2:8080`
- **Physical Device**: Use `http://YOUR_IP:8080` (find IP with `ifconfig`)

### Step 4: Start Mobile App (1 minute)
```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go for physical device

## First Time Use

1. **Create Account**
   - Tap "Don't have an account? Sign Up"
   - Enter username, email, password
   - Tap "Sign Up"

2. **Complete Profile**
   - Enter profession (e.g., "Software Engineer")
   - Enter organization (e.g., "Tech Corp")
   - Tap "Complete Profile"

3. **Explore**
   - Home: View and create posts
   - Messages: Chat with users
   - Profile: View your info

## Common Issues & Quick Fixes

### "Cannot connect to server"
```bash
# Check backend is running
curl http://localhost:8080/api/auth/login

# For Android emulator, update .env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080

# For physical device, use your computer's IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
```

### "Database connection failed"
```bash
# Check MySQL is running
mysql -u root -p

# Verify database exists
SHOW DATABASES;

# Update backend credentials in src/main/resources/application.properties
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

### "Expo app crashes"
```bash
cd friend
expo start -c  # Clear cache
```

### "Cannot find backend"
1. Verify backend is running: Check for "Started ProfessionalNetworkApplication"
2. Check your .env file has correct URL
3. Restart Expo: Stop and run `npm start` again

## Testing the App

### Create a Second User (for testing messages)
1. Logout from current account
2. Create new account with different username
3. Complete profile
4. Try messaging between accounts

### Test All Features
- [x] Login/Signup
- [x] View All Posts tab
- [x] View Professional Posts tab (same profession)
- [x] View Help Posts tab
- [x] Create a regular post
- [x] Create a help post
- [x] Like a post
- [x] Comment on a post
- [x] Send a message
- [x] View conversations
- [x] View profile

## Next Steps

1. Read [MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md) for detailed setup
2. Check [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for technical details
3. Review [API_TESTING.md](API_TESTING.md) for backend API documentation

## Getting Help

Check these files for solutions:
- Connection issues: `MOBILE_APP_GUIDE.md` > Troubleshooting
- Backend issues: `README.md` > Running the Application
- Feature questions: `IMPLEMENTATION_NOTES.md` > Features

## One-Command Start (After Initial Setup)

Create this script for easy startup:

**start-all.sh** (macOS/Linux):
```bash
#!/bin/bash
# Start MySQL
mysql.server start

# Start backend in background
cd /path/to/project
mvn spring-boot:run &

# Wait for backend
sleep 30

# Start mobile app
cd friend
npm start
```

Make executable: `chmod +x start-all.sh`
Run: `./start-all.sh`

---

**🎉 You're all set! Enjoy using the Professional Network mobile app!**
