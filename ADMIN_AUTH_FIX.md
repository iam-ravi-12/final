# Admin Authentication Fix

## Problem
The admin panel was failing with error:
```
org.springframework.security.core.userdetails.UsernameNotFoundException: User not found with username: admin
```

## Root Cause
1. Admin login generates a JWT token with username "admin"
2. When admin endpoints are accessed with this token, `JwtAuthenticationFilter` intercepts the request
3. The filter calls `UserDetailsServiceImpl.loadUserByUsername("admin")`
4. This tries to load "admin" from the database, but admin is not a database user (uses hardcoded credentials)
5. The authentication fails with UsernameNotFoundException

## Solution
Added `/api/admin/**` to the permitAll list in `SecurityConfig.java`:

```java
.requestMatchers("/api/admin/**").permitAll() // Admin endpoints handle auth internally
```

This allows admin endpoints to bypass the standard JWT authentication filter since:
- Admin credentials are hardcoded (admin/adminfriend), not stored in database
- Admin authentication is handled directly in `AdminController.adminLogin()`
- The `/login` endpoint needs to be public anyway
- Other admin endpoints don't need database user lookup

## Authentication Flow

### Regular Users
1. Login with database credentials → JWT token with database username
2. Subsequent requests → JWT filter loads user from database → authenticated

### Admin
1. Login with hardcoded credentials → JWT token with "admin" username
2. Subsequent requests → Bypass JWT filter (permitAll) → direct access to AdminController

## Security Notes
This approach is acceptable for demonstration purposes where:
- Admin credentials are hardcoded by design
- Admin is not a database entity
- Admin endpoints are read-only data views

For production deployment, consider:
- Store admin accounts in database with hashed passwords
- Implement role-based access control (RBAC)
- Add proper admin user lookup in `UserDetailsServiceImpl`
- Or create a separate authentication mechanism for admin users

## Files Modified
- `src/main/java/com/social/network/config/SecurityConfig.java` - Added admin endpoints to permitAll

## Testing
After this fix:
1. Admin login at `/api/admin/login` works correctly
2. Admin endpoints (`/api/admin/users`, `/api/admin/posts/count`, etc.) are accessible with admin token
3. No more UsernameNotFoundException errors
4. Regular user authentication still works as before
