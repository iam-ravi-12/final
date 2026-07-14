# Admin Panel Login Troubleshooting Guide

## Issue: Cannot Login to Admin Panel

If you're experiencing login issues with the admin panel, here are the possible causes and solutions:

### Cause 1: Backend Not Deployed to Production
**Symptom:** Login fails with network error or 404 error

**Solution:** The admin panel code needs to be deployed to your production server at `https://final-okus.onrender.com`

**Steps to Deploy:**
1. Push the latest code to your repository
2. Trigger a deployment on Render.com (or your hosting platform)
3. Wait for deployment to complete
4. Verify the admin endpoints are accessible

**Test if deployed:**
```bash
curl -X POST https://final-okus.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminfriend"}'
```

Expected response (if deployed):
```json
{
  "token": "eyJhbGc...",
  "username": "admin",
  "profileCompleted": true
}
```

### Cause 2: Testing Locally Without Running Backend
**Symptom:** Login fails immediately with connection error

**Solution:** Start the backend server locally

**Steps:**
1. Open a terminal in the project directory
2. Build the backend:
   ```bash
   cd /home/runner/work/final/final
   mvn clean package -DskipTests
   ```
3. Start the backend:
   ```bash
   java -jar target/professional-network-1.0.0.jar
   ```
4. In another terminal, start the frontend:
   ```bash
   cd frontend
   npm start
   ```
5. Access admin panel at: `http://localhost:3000/admin-login`

### Cause 3: Frontend Environment Variable Not Set
**Symptom:** Frontend connects to wrong API URL

**Solution:** Set the correct API URL for local testing

**For Local Development:**
1. Create `frontend/.env.local` file:
   ```
   REACT_APP_API_URL=http://localhost:8080/api
   ```
2. Restart the frontend server
3. Try login again

**For Production Testing:**
1. Ensure `frontend/.env.production` exists or:
2. Update `frontend/src/services/api.js` line 3 to point to your production server

### Cause 4: CORS Issues
**Symptom:** Login fails with CORS error in browser console

**Solution:** CORS is already configured in SecurityConfig to allow all origins. If still having issues:

1. Check browser console for specific CORS error
2. Verify SecurityConfig.java has:
   ```java
   .requestMatchers("/api/admin/**").permitAll()
   ```
3. Restart backend after any changes

### Cause 5: Incorrect Credentials
**Symptom:** Login returns "Invalid admin credentials" error

**Solution:** Verify you're using the exact credentials:
- Username: `admin` (case-sensitive, lowercase)
- Password: `adminfriend` (case-sensitive, lowercase, no spaces)

## Quick Test Checklist

1. **Is the backend running?**
   - Local: Check if `http://localhost:8080` is accessible
   - Production: Check if `https://final-okus.onrender.com` is accessible

2. **Are admin endpoints available?**
   ```bash
   # Test locally
   curl http://localhost:8080/api/admin/login
   
   # Test production
   curl https://final-okus.onrender.com/api/admin/login
   ```

3. **Is the frontend connecting to the right API?**
   - Check browser console for API calls
   - Look for the URL being called (should end with `/api/admin/login`)

4. **Are there any browser console errors?**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

## Current Setup

Your code is configured to:
- **Frontend API URL:** `https://final-okus.onrender.com/api` (can be overridden with `REACT_APP_API_URL` env var)
- **Admin Login Endpoint:** `/api/admin/login`
- **Admin Credentials:**
  - Username: `admin`
  - Password: `adminfriend`

## For Local Development

To test the admin panel locally:

1. **Terminal 1 - Backend:**
   ```bash
   cd /home/runner/work/final/final
   mvn clean package -DskipTests
   java -jar target/professional-network-1.0.0.jar
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd /home/runner/work/final/final/frontend
   echo "REACT_APP_API_URL=http://localhost:8080/api" > .env.local
   npm start
   ```

3. **Browser:**
   - Navigate to `http://localhost:3000/admin-login`
   - Login with: `admin` / `adminfriend`

## For Production Use

To use the admin panel in production:

1. **Deploy the Code:**
   - Push all changes to your repository
   - Trigger deployment on your hosting platform
   - Wait for deployment to complete

2. **Verify Deployment:**
   ```bash
   curl -X POST https://final-okus.onrender.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"adminfriend"}'
   ```

3. **Access Admin Panel:**
   - Navigate to your production URL + `/admin-login`
   - Example: `https://your-frontend-url.com/admin-login`
   - Login with: `admin` / `adminfriend`

## Need More Help?

If you're still having issues:

1. **Check the browser console** for specific error messages
2. **Check backend logs** for any errors
3. **Verify the SecurityConfig** has `/api/admin/**` in permitAll
4. **Ensure database is connected** (backend needs database for other features)
5. **Test with curl** to isolate frontend vs backend issues

## Debug Commands

```bash
# Check if backend is running locally
curl http://localhost:8080/actuator/health 2>/dev/null || echo "Backend not running"

# Check if backend is running in production
curl https://final-okus.onrender.com/actuator/health 2>/dev/null || echo "Production not accessible"

# Test admin login locally
curl -v -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminfriend"}'

# Test admin login in production
curl -v -X POST https://final-okus.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminfriend"}'
```

The `-v` flag will show you the full request/response including headers and any errors.
