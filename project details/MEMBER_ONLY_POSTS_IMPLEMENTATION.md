# Member-Only Post Viewing - Implementation Details

## Overview
As per user request, posts in communities are now restricted to members only. Users who haven't joined a community cannot see posts, regardless of whether the community is public or private.

## Problem Statement
> "if user has not joined the community then they cannot see the post of that community. make this change in both application and website also."

## Implementation

### 1. Backend Changes (Java Spring Boot)

**File:** `src/main/java/com/social/network/service/CommunityService.java`

**Before:**
```java
public List<CommunityPostResponse> getCommunityPosts(Long communityId, Long userId) {
    Community community = communityRepository.findById(communityId)
            .orElseThrow(() -> new RuntimeException("Community not found"));

    // Check if user is a member (for private communities ONLY)
    if (community.getIsPrivate()) {
        if (communityMemberRepository.findByCommunityIdAndUserId(communityId, userId).isEmpty()) {
            throw new RuntimeException("Must be a member to view posts");
        }
    }

    List<CommunityPost> posts = communityPostRepository.findApprovedPostsByCommunityId(communityId);
    return posts.stream()
            .map(this::toCommunityPostResponse)
            .collect(Collectors.toList());
}
```

**After:**
```java
public List<CommunityPostResponse> getCommunityPosts(Long communityId, Long userId) {
    Community community = communityRepository.findById(communityId)
            .orElseThrow(() -> new RuntimeException("Community not found"));

    // Check if user is a member - required for ALL communities (public and private)
    if (communityMemberRepository.findByCommunityIdAndUserId(communityId, userId).isEmpty()) {
        throw new RuntimeException("Must be a member to view posts");
    }

    List<CommunityPost> posts = communityPostRepository.findApprovedPostsByCommunityId(communityId);
    return posts.stream()
            .map(this::toCommunityPostResponse)
            .collect(Collectors.toList());
}
```

**Key Change:** Removed the `if (community.getIsPrivate())` condition, making membership required for all communities.

### 2. Friend App Changes (React Native)

**File:** `friend/screens/CommunityPostsScreen.tsx`

**Changes:**
1. Check `isMember` property before loading posts
2. Added join prompt UI for non-members
3. Hide create post button and admin tabs for non-members

**Code:**
```typescript
const loadCommunityData = async () => {
  try {
    setLoading(true);
    const communityData = await communityService.getCommunityById(communityId);
    
    setCommunity(communityData);

    // Only load posts if user is a member
    if (communityData.isMember) {
      const postsData = await communityService.getCommunityPosts(communityId);
      setApprovedPosts(postsData);

      // Load pending posts if user is admin
      if (communityData.isAdmin) {
        const pending = await communityService.getPendingPosts(communityId);
        setPendingPosts(pending);
      }
    } else {
      // Clear posts if not a member
      setApprovedPosts([]);
      setPendingPosts([]);
    }
  } catch (error) {
    console.error('Error loading community data:', error);
    Alert.alert('Error', 'Failed to load community data');
  } finally {
    setLoading(false);
  }
};
```

**UI Changes:**
```typescript
{!community.isMember ? (
  <View style={styles.notMemberContainer}>
    <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
    <Text style={styles.notMemberTitle}>Join to See Posts</Text>
    <Text style={styles.notMemberText}>
      You must be a member of this community to view and create posts.
    </Text>
    <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
      <Text style={styles.joinButtonText}>Join Community</Text>
    </TouchableOpacity>
  </View>
) : (
  // Show posts and create post button
)}
```

### 3. Website Changes (React)

**File:** `frontend/src/pages/CommunityDetail.js`

**Changes:**
1. Check `isMember` before loading posts
2. Added styled join prompt for non-members
3. Hide create post section and admin tabs for non-members

**Code:**
```javascript
const loadCommunityData = async () => {
  try {
    setLoading(true);
    const communityData = await communityService.getCommunityById(communityId);
    setCommunity(communityData);

    // Only load posts if user is a member
    if (communityData.isMember) {
      const postsData = await communityService.getCommunityPosts(communityId);
      setPosts(postsData);

      if (communityData.isAdmin) {
        const pendingData = await communityService.getPendingPosts(communityId);
        setPendingPosts(pendingData);
      }
    } else {
      // Clear posts if not a member
      setPosts([]);
      setPendingPosts([]);
    }
  } catch (err) {
    setError('Failed to load community. Please try again.');
    console.error('Error loading community:', err);
  } finally {
    setLoading(false);
  }
};
```

**UI Changes:**
```jsx
{!community.isMember ? (
  <div className="not-member-container">
    <div className="not-member-content">
      <div className="not-member-icon">🔒</div>
      <h2>Join to See Posts</h2>
      <p>You must be a member of this community to view and create posts.</p>
      <button className="btn-join-community" onClick={handleJoinCommunity}>
        Join Community
      </button>
    </div>
  </div>
) : (
  // Show posts and create post section
)}
```

## User Flow

### Before (Old Behavior)
1. User visits any public community
2. User sees all posts immediately
3. User can create posts without joining

### After (New Behavior)

#### For Non-Members
1. User visits any community (public or private)
2. User sees community details (name, description, member count)
3. **User sees "Join to See Posts" prompt**
4. User clicks "Join Community" button
5. After joining, posts load automatically
6. User can now create posts

#### For Members
1. User visits joined community
2. User sees all approved posts
3. User can create posts
4. If admin, user can also approve/reject pending posts

## Visual Representation

### Friend App (Mobile) - Non-Member View
```
┌─────────────────────────────────────┐
│  ← Tech Enthusiasts            🔗  │
├─────────────────────────────────────┤
│  📷  A community for tech lovers    │
│      👤 25 members                 │
│                        [Leave]      │ (Only if member)
├─────────────────────────────────────┤
│                                     │
│            🔒 (lock icon)           │
│                                     │
│         Join to See Posts           │
│                                     │
│  You must be a member of this       │
│  community to view and create       │
│  posts.                             │
│                                     │
│      [Join Community Button]        │
│                                     │
└─────────────────────────────────────┘
```

### Website - Non-Member View
```
┌─────────────────────────────────────┐
│  Community Details                  │
│  Name, Description, Member Count    │
│  Share Button, Leave Button         │
├─────────────────────────────────────┤
│                                     │
│              🔒                     │
│                                     │
│         Join to See Posts           │
│                                     │
│  You must be a member of this       │
│  community to view and create       │
│  posts.                             │
│                                     │
│      [Join Community Button]        │
│                                     │
└─────────────────────────────────────┘
```

## Testing Checklist

### Backend Testing
- [ ] Non-member tries to access `GET /api/communities/{id}/posts`
  - Expected: 400 Bad Request with "Must be a member to view posts"
- [ ] Member accesses `GET /api/communities/{id}/posts`
  - Expected: 200 OK with list of posts
- [ ] Works for both public and private communities

### Friend App Testing
- [ ] Non-member visits community
  - Expected: See join prompt, no posts visible
- [ ] Non-member clicks "Join Community"
  - Expected: Success alert, posts load automatically
- [ ] Member views community
  - Expected: See posts and create post button
- [ ] Admin views community
  - Expected: See posts, create button, and admin tabs

### Website Testing
- [ ] Non-member visits community
  - Expected: See styled join prompt, no posts
- [ ] Non-member clicks "Join Community"
  - Expected: Success alert, posts load
- [ ] Member views community
  - Expected: See posts and create post section
- [ ] Admin views community
  - Expected: See posts, create section, and admin tabs

## Security Considerations

**Why This Change Matters:**
1. **Privacy Control:** Community admins have better control over who sees content
2. **Engagement:** Encourages users to join communities before consuming content
3. **Consistency:** Same behavior for public and private communities
4. **Backend Enforcement:** Not just UI-level hiding; enforced at API level

**Defense in Depth:**
- Backend validates membership before returning posts
- Frontend checks membership before requesting posts
- Clear user feedback when access is restricted
- Easy path to join (one-click button)

## Commit Information

**Commit:** `acd3305`
**Message:** "Restrict post viewing to community members only in both app and website"
**Date:** December 13, 2024

**Files Changed:**
1. `src/main/java/com/social/network/service/CommunityService.java`
2. `friend/screens/CommunityPostsScreen.tsx`
3. `frontend/src/pages/CommunityDetail.js`
4. `frontend/src/pages/CommunityDetail.css`

## Impact

✅ **Backend:** All communities now require membership to view posts
✅ **Friend App:** Non-members see join prompt with call-to-action
✅ **Website:** Non-members see styled join prompt
✅ **Security:** Enforced at API level, not just UI
✅ **UX:** Clear messaging and easy join flow

This change enhances privacy control while maintaining a smooth user experience across both platforms.
