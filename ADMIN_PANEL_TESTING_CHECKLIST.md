# Admin Panel Testing Checklist

## Prerequisites
- [ ] Backend application is running (port 8080)
- [ ] Frontend application is running (port 3000)
- [ ] Database is connected and populated with test data

## Test Case 1: Admin Login - Success
**Steps:**
1. Navigate to `http://localhost:3000/admin-login`
2. Enter username: `admin`
3. Enter password: `adminfriend`
4. Click "Login as Admin"

**Expected Result:**
- ✅ Login successful
- ✅ Redirected to `/admin` dashboard
- ✅ Admin token stored in localStorage
- ✅ Statistics cards display correct counts

## Test Case 2: Admin Login - Invalid Credentials
**Steps:**
1. Navigate to `http://localhost:3000/admin-login`
2. Enter username: `admin`
3. Enter password: `wrongpassword`
4. Click "Login as Admin"

**Expected Result:**
- ✅ Error message displayed
- ✅ Remains on login page
- ✅ No token stored

## Test Case 3: Dashboard Statistics Display
**Steps:**
1. Login as admin
2. Observe the statistics cards

**Expected Result:**
- ✅ Total Users displays correct count
- ✅ Total Posts displays correct count
- ✅ Total Communities displays correct count
- ✅ Total SOS Requests displays correct count
- ✅ All numbers are non-negative integers

## Test Case 4: Users Tab - View All Users
**Steps:**
1. Login as admin
2. Click on "Users" tab (should be default)
3. Observe the users table

**Expected Result:**
- ✅ Users tab is highlighted
- ✅ Table displays all users
- ✅ All columns are populated: ID, Username, Name, Email, Profession, Organization, Location, Points, Joined Date
- ✅ Table is scrollable if content exceeds viewport
- ✅ Dates are formatted properly

## Test Case 5: Communities Tab - View All Communities
**Steps:**
1. Login as admin
2. Click on "Communities" tab
3. Observe the communities table

**Expected Result:**
- ✅ Communities tab is highlighted
- ✅ Table displays all communities
- ✅ All columns are populated: ID, Name, Description, Admin, Privacy, Members, Created Date, Actions
- ✅ "View Members" button visible for each community
- ✅ Member count matches actual members

## Test Case 6: Communities - View Members Modal
**Steps:**
1. Login as admin
2. Click on "Communities" tab
3. Click "View Members" button on any community
4. Observe the modal

**Expected Result:**
- ✅ Modal opens with overlay
- ✅ Modal title shows community name
- ✅ Members table displays: User ID, Username, Name, Profession, Joined At
- ✅ Close button (×) is visible
- ✅ Click outside modal closes it
- ✅ Click × button closes modal

## Test Case 7: SOS Requests Tab - View All Requests
**Steps:**
1. Login as admin
2. Click on "SOS Requests" tab
3. Observe the SOS requests table

**Expected Result:**
- ✅ SOS Requests tab is highlighted
- ✅ Table displays all SOS requests
- ✅ All columns are populated: ID, User, Emergency Type, Status, Location, Description, Responses, Created, Resolved, Actions
- ✅ Status badges are color-coded (ACTIVE=green, CANCELLED=red, RESOLVED=blue, EXPIRED=gray)
- ✅ "View Responses" button visible for each request
- ✅ Response count matches actual responses

## Test Case 8: SOS Requests - View Responses Modal
**Steps:**
1. Login as admin
2. Click on "SOS Requests" tab
3. Click "View Responses" button on any SOS request
4. Observe the modal

**Expected Result:**
- ✅ Modal opens with overlay
- ✅ Modal title shows SOS request ID
- ✅ If responses exist: table displays Responder, Response Type, Message, Points Awarded, Confirmed, Responded At
- ✅ If no responses: "No responses yet." message displayed
- ✅ Close button (×) is visible
- ✅ Click outside modal closes it
- ✅ Click × button closes modal

## Test Case 9: Logout Functionality
**Steps:**
1. Login as admin
2. Click "Logout" button in header
3. Observe the result

**Expected Result:**
- ✅ Redirected to `/admin-login`
- ✅ Admin token removed from localStorage
- ✅ isAdmin flag removed from localStorage
- ✅ Cannot access `/admin` without logging in again

## Test Case 10: Protected Route - Direct Access
**Steps:**
1. Without logging in, navigate directly to `http://localhost:3000/admin`

**Expected Result:**
- ✅ Automatically redirected to `/admin-login`
- ✅ Cannot view dashboard without authentication

## Test Case 11: Session Persistence
**Steps:**
1. Login as admin
2. Refresh the page
3. Observe the state

**Expected Result:**
- ✅ Still logged in
- ✅ Dashboard data reloads
- ✅ Session maintained

## Test Case 12: Responsive Design - Mobile View
**Steps:**
1. Login as admin
2. Resize browser to mobile width (< 768px)
3. Navigate through all tabs

**Expected Result:**
- ✅ Statistics cards stack vertically
- ✅ Tabs stack vertically
- ✅ Tables are horizontally scrollable
- ✅ Modals take up 95% width
- ✅ All features remain functional

## Test Case 13: Responsive Design - Tablet View
**Steps:**
1. Login as admin
2. Resize browser to tablet width (768px - 1400px)
3. Navigate through all tabs

**Expected Result:**
- ✅ Statistics cards display 2 per row
- ✅ Tables adjust to available space
- ✅ Modals are appropriately sized
- ✅ All features remain functional

## Test Case 14: API Error Handling
**Steps:**
1. Login as admin
2. Stop the backend server
3. Refresh the dashboard

**Expected Result:**
- ✅ Error message displayed
- ✅ Application doesn't crash
- ✅ User is informed of the issue

## Test Case 15: Data Accuracy
**Steps:**
1. Login as admin
2. Note the counts in statistics cards
3. Verify against database:
   - Count users in database
   - Count posts in database
   - Count communities in database
   - Count SOS alerts in database

**Expected Result:**
- ✅ All counts match database values
- ✅ User data matches database records
- ✅ Community data matches database records
- ✅ SOS data matches database records

## API Endpoint Tests

### Test Endpoint: POST /api/admin/login
```bash
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminfriend"}'
```
**Expected:** 200 OK with JWT token

### Test Endpoint: GET /api/admin/users
```bash
curl -X GET http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer <admin_token>"
```
**Expected:** 200 OK with array of users

### Test Endpoint: GET /api/admin/posts/count
```bash
curl -X GET http://localhost:8080/api/admin/posts/count \
  -H "Authorization: Bearer <admin_token>"
```
**Expected:** 200 OK with {"totalPosts": number}

### Test Endpoint: GET /api/admin/communities
```bash
curl -X GET http://localhost:8080/api/admin/communities \
  -H "Authorization: Bearer <admin_token>"
```
**Expected:** 200 OK with array of communities

### Test Endpoint: GET /api/admin/communities/{id}/members
```bash
curl -X GET http://localhost:8080/api/admin/communities/1/members \
  -H "Authorization: Bearer <admin_token>"
```
**Expected:** 200 OK with array of community members

### Test Endpoint: GET /api/admin/sos
```bash
curl -X GET http://localhost:8080/api/admin/sos \
  -H "Authorization: Bearer <admin_token>"
```
**Expected:** 200 OK with array of SOS requests and total count

### Test Endpoint: GET /api/admin/sos/{id}/responses
```bash
curl -X GET http://localhost:8080/api/admin/sos/1/responses \
  -H "Authorization: Bearer <admin_token>"
```
**Expected:** 200 OK with array of responses

## Performance Tests

### Test Case 16: Large Dataset Handling
**Steps:**
1. Ensure database has 1000+ users
2. Login as admin
3. Click Users tab
4. Observe loading time

**Expected Result:**
- ✅ Page loads within 3 seconds
- ✅ No browser freezing
- ✅ Smooth scrolling

### Test Case 17: Multiple Modal Operations
**Steps:**
1. Login as admin
2. Open and close 10 different community member modals
3. Open and close 10 different SOS response modals

**Expected Result:**
- ✅ No memory leaks
- ✅ Smooth animations
- ✅ No performance degradation

## Security Tests

### Test Case 18: Token Expiration
**Steps:**
1. Login as admin
2. Wait for token to expire (or manually delete token)
3. Try to access dashboard

**Expected Result:**
- ✅ Redirected to login
- ✅ 401 error handled gracefully

### Test Case 19: Invalid Token
**Steps:**
1. Manually set invalid adminToken in localStorage
2. Try to access dashboard

**Expected Result:**
- ✅ API requests fail
- ✅ Redirected to login
- ✅ Error message displayed

### Test Case 20: XSS Prevention
**Steps:**
1. Check if any user-generated content is displayed
2. Verify HTML entities are escaped

**Expected Result:**
- ✅ No script execution from data
- ✅ HTML tags displayed as text

## Browser Compatibility Tests

### Test Case 21: Cross-Browser Testing
**Browsers to Test:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Expected Result:**
- ✅ All features work in all browsers
- ✅ Styling is consistent
- ✅ No console errors

## Summary

Total Test Cases: 21
- Functional Tests: 15
- API Tests: 7
- Performance Tests: 2
- Security Tests: 3
- Browser Compatibility: 1

**Pass Criteria:** All test cases should pass for the admin panel to be considered production-ready.

## Bug Reporting Template

If any test fails, report using this format:

```
**Test Case:** [Test case number and name]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: 
- OS: 
- Backend Version: 
- Frontend Version: 

**Screenshots/Logs:**
[Attach if available]
```
