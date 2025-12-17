# Admin Panel Implementation Guide

## Overview
An admin web panel has been implemented with hardcoded credentials to manage and monitor the application.

## Admin Credentials
- **Username/ID**: `admin`
- **Password**: `adminfriend`

## Access URLs
- **Admin Login Page**: `/admin-login`
- **Admin Dashboard**: `/admin` (redirects to login if not authenticated)

## Features Implemented

### 1. Admin Login
- Dedicated login page at `/admin-login`
- Hardcoded authentication with username `admin` and password `adminfriend`
- Redirects to admin dashboard upon successful login
- Token-based session management

### 2. Admin Dashboard (`/admin`)
The dashboard provides comprehensive administrative insights:

#### Statistics Overview
Four main stat cards displaying:
- Total Users count
- Total Posts count
- Total Communities count
- Total SOS Requests count

#### Users Tab
- Complete list of all registered users
- Columns displayed:
  - User ID
  - Username
  - Name
  - Email
  - Profession
  - Organization
  - Location
  - Leaderboard Points
  - Join Date

#### Communities Tab
- List of all communities
- Columns displayed:
  - Community ID
  - Name
  - Description
  - Admin Name
  - Privacy Status (Public/Private)
  - Member Count
  - Created Date
- **Action**: "View Members" button opens a modal showing:
  - User ID
  - Username
  - Name
  - Profession
  - Join Date

#### SOS Requests Tab
- Complete list of all SOS emergency requests
- Columns displayed:
  - SOS Request ID
  - User who raised the request
  - Emergency Type
  - Status (ACTIVE, CANCELLED, RESOLVED, EXPIRED)
  - Location Address/Coordinates
  - Description
  - Number of Responses
  - Created Date
  - Resolved Date
- **Action**: "View Responses" button opens a modal showing:
  - Responder Name and Username
  - Response Type
  - Message
  - Points Awarded
  - Confirmation Status
  - Response Date

## Backend API Endpoints

### Authentication
- `POST /api/admin/login`
  - Body: `{ "username": "admin", "password": "adminfriend" }`
  - Returns: JWT token for admin session

### Data Retrieval
- `GET /api/admin/users` - Fetch all users
- `GET /api/admin/posts/count` - Get total posts count
- `GET /api/admin/communities` - Fetch all communities with member counts
- `GET /api/admin/communities/{id}/members` - Fetch members of a specific community
- `GET /api/admin/sos` - Fetch all SOS requests with response counts
- `GET /api/admin/sos/{id}/responses` - Fetch responses to a specific SOS request

## Frontend Components

### Files Created
1. **AdminLogin.js** - Login page component
2. **AdminDashboard.js** - Main dashboard component
3. **Admin.css** - Styling for admin pages
4. **adminService.js** - Service layer for API calls

### Styling Features
- Responsive design that works on mobile and desktop
- Clean, modern UI with card-based layout
- Tabbed interface for easy navigation
- Modal popups for detailed views
- Status badges with color coding
- Hover effects and smooth transitions

## Security Considerations

### Implemented
- JWT token-based authentication
- Separate admin authentication flow
- Session management with localStorage

### Recommendations for Production
1. **Replace hardcoded credentials** with:
   - Database-stored admin accounts
   - Password hashing (bcrypt)
   - Multi-factor authentication
2. **Add role-based access control (RBAC)**
3. **Implement rate limiting** on admin endpoints
4. **Add audit logging** for admin actions
5. **Use HTTPS** for all admin communications
6. **Add CSRF protection**
7. **Implement session timeout**
8. **Add IP whitelisting** for admin access

## Testing the Admin Panel

### Manual Testing Steps
1. Start the backend application
2. Start the frontend application
3. Navigate to `http://localhost:3000/admin-login`
4. Enter credentials:
   - Username: `admin`
   - Password: `adminfriend`
5. Click "Login as Admin"
6. Verify access to admin dashboard
7. Test each tab (Users, Communities, SOS Requests)
8. Test modal functionalities:
   - Click "View Members" on any community
   - Click "View Responses" on any SOS request
9. Test logout functionality

### Expected Behavior
- Login page should validate credentials
- Dashboard should load all statistics
- All tables should display data properly
- Modals should open and close correctly
- Logout should clear session and redirect to login

## Integration Notes

### Database Requirements
The admin panel works with the existing database schema:
- `users` table
- `posts` table
- `communities` table
- `community_members` table
- `sos_alerts` table
- `sos_responses` table

### No Migration Required
All functionality uses existing database tables and relationships.

## Future Enhancements

Potential features to add:
1. User management (suspend/activate accounts)
2. Content moderation (approve/reject posts)
3. Community management (delete/edit communities)
4. Analytics dashboard with charts
5. Export data to CSV/Excel
6. Search and filter functionality
7. Real-time updates using WebSocket
8. Activity logs and audit trail
9. Email notifications for admin actions
10. Advanced reporting features

## Support

For issues or questions regarding the admin panel, please refer to:
- The source code in `frontend/src/pages/AdminDashboard.js`
- The API controller in `src/main/java/com/social/network/controller/AdminController.java`
- The admin service in `frontend/src/services/adminService.js`
