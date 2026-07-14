# Mobile App Troubleshooting Guide

## Common Issue: "Bad Credentials" or "Could not create account"

If you're getting these errors when trying to login or signup, it's likely a **backend connectivity issue**, not an authentication problem.

### Quick Diagnosis

Check the Expo console for error messages. You should see logs like:
```
API Configuration: { url: 'http://...', envVar: 'http://...' }
```

And if there's a connection error:
```
API Error - No Response: [Request object]
API URL: http://localhost:8080
```

### Common Causes & Solutions

#### 1. Backend Not Running
**Problem**: The Spring Boot backend is not running.

**Solution**:
```bash
# In the project root directory
mvn spring-boot:run
```

Wait for the message: `Started ProfessionalNetworkApplication in X seconds`

Verify it's running:
```bash
curl http://localhost:8080/api/auth/login
```

Should return: `{"timestamp":"...","status":405,"error":"Method Not Allowed"...}` (This is good - it means the endpoint exists)

#### 2. Wrong API URL Configuration

**Problem**: The `.env` file has the wrong API URL for your device/emulator.

**Solution**:

Create/edit `friend/.env` file:

**For iOS Simulator:**
```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

**For Android Emulator:**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
```

**For Physical Device (same WiFi network):**
```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8080
```

To find your computer's IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

**After changing .env, restart Expo:**
```bash
# Stop the Expo server (Ctrl+C)
# Clear cache and restart
expo start -c
```

#### 3. Firewall Blocking Connection

**Problem**: Your computer's firewall is blocking incoming connections on port 8080.

**Solution**:

**macOS:**
```bash
# Allow incoming connections on port 8080
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/java
```

**Windows:**
- Open Windows Defender Firewall
- Click "Advanced settings"
- Click "Inbound Rules" → "New Rule"
- Select "Port" → Next
- Enter port 8080 → Next
- Allow the connection → Next
- Apply to all profiles → Next
- Name it "Spring Boot" → Finish

**Linux:**
```bash
sudo ufw allow 8080
```

#### 4. Network Connectivity

**Problem**: Device and computer are on different networks.

**Solution**:
- Ensure both the device and computer are on the same WiFi network
- Don't use VPN on either device
- Some corporate/public WiFi networks block device-to-device communication

#### 5. Backend Database Not Running

**Problem**: MySQL database is not running.

**Solution**:
```bash
# Start MySQL
mysql.server start  # macOS
# OR
sudo service mysql start  # Linux

# Verify it's running
mysql -u root -p
```

### Testing the Connection

#### Test 1: Can you reach the backend from your computer?
```bash
curl http://localhost:8080/api/auth/login
```

Expected: `{"timestamp":"...","status":405,"error":"Method Not Allowed"...}`

#### Test 2: Can you reach the backend from your device?
For physical devices, from your phone's browser, visit:
```
http://YOUR_COMPUTER_IP:8080/api/auth/login
```

Expected: Same JSON error message (this is good!)

If you get "Cannot connect" or timeout, there's a network/firewall issue.

#### Test 3: Check Expo Console
When you try to login/signup, check the Expo console for detailed error messages:
- `API Configuration: ...` - Shows what URL is being used
- `API Error Response: ...` - Shows backend error details
- `API Error - No Response: ...` - Shows connection was refused

### Debugging Steps

1. **Check backend is running:**
   ```bash
   curl http://localhost:8080/api/auth/login
   ```

2. **Check .env file exists and has correct URL:**
   ```bash
   cat friend/.env
   ```

3. **Restart Expo with cache clear:**
   ```bash
   cd friend
   expo start -c
   ```

4. **Check Expo console for "API Configuration" log**
   - Should show your configured API URL

5. **Try to login and check console for error details**

### Still Not Working?

If none of the above solutions work:

1. **Check backend logs** for any errors when you try to login/signup
2. **Test with a simple API client** like Postman:
   ```
   POST http://localhost:8080/api/auth/signup
   Body: {
     "username": "testuser",
     "email": "test@example.com",
     "password": "password123"
   }
   ```
3. **Verify database connection** in backend logs
4. **Check CORS settings** in backend (should allow all origins in development)

### Success Indicators

When everything is working correctly:

1. **Expo console shows:**
   ```
   API Configuration: { url: 'http://10.0.2.2:8080', envVar: 'http://10.0.2.2:8080' }
   ```

2. **Backend console shows:**
   ```
   POST /api/auth/signup
   POST /api/auth/login
   ```

3. **App behavior:**
   - Signup creates account and navigates to profile setup
   - Login authenticates and navigates to home (if profile complete) or profile setup

### Quick Fix Checklist

- [ ] Backend running (`mvn spring-boot:run`)
- [ ] MySQL running and database exists
- [ ] `.env` file exists in `friend/` folder
- [ ] `.env` has correct API URL for your device type
- [ ] Expo restarted with cache clear (`expo start -c`)
- [ ] Device and computer on same WiFi (for physical devices)
- [ ] Firewall allows port 8080
- [ ] Can curl the backend from computer
- [ ] Console shows "API Configuration" with correct URL
