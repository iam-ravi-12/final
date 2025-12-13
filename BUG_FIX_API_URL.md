# Bug Fix: API URL Missing /api Suffix

## Problem

Communities were not loading and community creation was failing in the friend mobile app, even though the same features worked correctly on the website.

## Root Cause

The friend app's API base URL was missing the `/api` suffix that the backend requires.

### Before (Broken)
```typescript
// friend/services/api.ts
const API_URL = 'https://final-okus.onrender.com';

// When calling communityService.getMyCommunities()
// Result: GET https://final-okus.onrender.com/communities/my
// Expected: GET https://final-okus.onrender.com/api/communities/my
// Status: 404 Not Found ❌
```

### After (Fixed)
```typescript
// friend/services/api.ts
const API_URL = 'https://final-okus.onrender.com/api';

// When calling communityService.getMyCommunities()
// Result: GET https://final-okus.onrender.com/api/communities/my
// Status: 200 OK ✅
```

## Why This Happened

The website implementation correctly includes `/api` in the base URL:

```javascript
// frontend/src/services/api.js (Website - Working)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://final-okus.onrender.com/api';
```

But the friend app initially didn't include it:

```typescript
// friend/services/api.ts (Mobile App - Was Broken)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://final-okus.onrender.com';
```

## Backend Endpoints

All Spring Boot controllers use the `/api` prefix:

```java
@RestController
@RequestMapping("/api/communities")
public class CommunityController {
    // All endpoints are under /api/communities/*
}
```

## Files Changed

1. **friend/services/api.ts**
   - Added `/api` suffix to default API_URL
   - Added comment explaining the requirement

2. **friend/.env.example**
   - Updated example to include `/api` suffix
   - Added warning comment about requirement

## Testing

After the fix, all API calls now work correctly:

### Community List
```
GET /api/communities/my → 200 OK ✅
GET /api/communities/public → 200 OK ✅
```

### Community Creation
```
POST /api/communities
Body: { name: "Test", description: "...", isPrivate: false }
→ 200 OK, returns created community ✅
```

### Community Details
```
GET /api/communities/123 → 200 OK ✅
```

### Posts
```
GET /api/communities/123/posts → 200 OK ✅
POST /api/communities/123/posts → 200 OK ✅
```

## Environment Variables

For local development, update your `.env` file:

```bash
# Before (Wrong)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080

# After (Correct)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api
```

**Important:** Always include the `/api` suffix in your API URL configuration!

## Impact

✅ Communities now load correctly
✅ Community creation works
✅ All CRUD operations functional
✅ Post creation and approval works
✅ Share functionality works
✅ Join/Leave operations work

## Commit

Fixed in commit: `8fc3abf` - "Fix API URL to include /api suffix for backend endpoints"
