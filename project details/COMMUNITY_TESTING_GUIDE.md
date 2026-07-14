# Community Feature Testing Guide

## Overview
This guide provides step-by-step instructions for testing all community features in the Friend mobile app.

## Prerequisites
- Friend app installed and running
- Valid user account logged in
- Backend API accessible

## Test Scenarios

### 1. Community List View

#### Test: View My Communities
1. Open the app
2. Navigate to Communities tab (👥 icon)
3. Verify you see "My Communities" tab selected by default
4. **Expected**: List of communities you've joined (or empty state if none)

#### Test: View Public Communities
1. Tap on "Public Communities" tab
2. **Expected**: List of all public communities available

#### Test: Pull to Refresh
1. Pull down on community list
2. **Expected**: Refresh animation and updated list

#### Test: Empty States
1. Ensure account has no communities
2. View "My Communities" tab
3. **Expected**: Empty state with 👥 icon and message "You haven't joined any communities yet"

### 2. Community Card Display

For each community card, verify the following are displayed:

#### Required Elements
- [ ] Community icon (profile picture or letter initial)
- [ ] Community name
- [ ] Description (max 2 lines)
- [ ] Member count (e.g., "5 members" or "1 member")
- [ ] Admin username (e.g., "by @john")

#### Conditional Elements
- [ ] 🔒 Lock icon if community is private
- [ ] 👑 Admin badge if current user is admin
- [ ] Share button (🔗 icon)
- [ ] View button (for members)
- [ ] Join button (for non-members of public communities)

### 3. Create Community

#### Test: Open Create Modal
1. Tap the blue floating action button (+ icon) in bottom-right
2. **Expected**: Bottom sheet modal appears with "Create Community" title

#### Test: Create Public Community
1. Enter community name: "Test Public Community"
2. Enter description: "This is a test community"
3. Leave "Private Community" unchecked
4. Tap "Create"
5. **Expected**: 
   - Success alert "Community created successfully!"
   - Modal closes
   - New community appears in "My Communities" with 👑 Admin badge

#### Test: Create Private Community
1. Tap FAB
2. Enter community name: "Test Private Community"
3. Enter description: "This is a private test"
4. Check "Private Community" checkbox
5. Tap "Create"
6. **Expected**: 
   - Success alert
   - Community created with 🔒 lock icon

#### Test: Form Validation
1. Tap FAB
2. Leave name empty
3. Tap "Create"
4. **Expected**: Error alert "Please enter a community name"

#### Test: Cancel Creation
1. Tap FAB
2. Enter some text
3. Tap "Cancel"
4. **Expected**: Modal closes without creating community

### 4. Share Community

#### Test: Share on Mobile
1. Find any community card
2. Tap the Share button (🔗)
3. **Expected**: Native share sheet appears with community info

#### Test: Share on Web
1. Find any community card
2. Tap the Share button
3. **Expected**: Alert "Link Copied" and clipboard contains URL

### 5. Join/Leave Communities

#### Test: Join Community
1. Go to "Public Communities" tab
2. Find a community you're not a member of
3. Tap "Join" button
4. **Expected**: 
   - Success alert "Joined community successfully"
   - Button changes to show community is joined
   - Community appears in "My Communities" tab

#### Test: Leave Community (from list)
1. Go to "My Communities"
2. Find a community you're not admin of
3. Tap the community to open details
4. Verify "Leave" button is visible

### 6. Community Detail View

#### Test: Open Community Detail
1. Tap "View" button on any community card
2. **Expected**: Navigate to community detail screen with:
   - Back button (←)
   - Community name in header
   - Share button (🔗)
   - Community avatar
   - Description
   - Member count
   - Private badge (if private)
   - Admin badge (if you're admin)

#### Test: Leave Community (from detail)
1. Open any community you're not admin of
2. Tap "Leave" button
3. **Expected**: 
   - Confirmation alert "Are you sure you want to leave this community?"
   - Tap "Leave"
   - Navigate back to community list
   - Community removed from "My Communities"

#### Test: Share from Detail
1. Open any community detail
2. Tap share icon (🔗) in header
3. **Expected**: Share sheet or clipboard copy confirmation

### 7. Create Post

#### Test: Open Create Post Modal
1. Open any community detail
2. Tap "Create Post" button
3. **Expected**: Bottom sheet modal appears with:
   - "Create Post" title
   - Text input field
   - "Post" and "Cancel" buttons

#### Test: Submit Post
1. Open create post modal
2. Enter content: "This is a test post!"
3. Tap "Post"
4. **Expected**: 
   - Alert "Post submitted successfully! It will appear once approved by the admin."
   - Modal closes
   - If you're admin: Post appears immediately in approved posts
   - If not admin: Post appears in pending (admin view only)

#### Test: Post Validation
1. Open create post modal
2. Leave content empty
3. Tap "Post"
4. **Expected**: Error alert "Please enter post content"

#### Test: Cancel Post
1. Open create post modal
2. Enter some text
3. Tap "Cancel"
4. **Expected**: Modal closes, text is cleared

### 8. Admin Features - Post Approval

#### Test: View Tabs (Admin Only)
1. As community admin, open your community
2. **Expected**: See two tabs:
   - "Approved Posts" (active by default)
   - "Pending (X)" where X is the count

#### Test: Switch to Pending Tab
1. Tap "Pending" tab
2. **Expected**: See list of posts awaiting approval

#### Test: Approve Post
1. Go to "Pending" tab
2. Find a post
3. Tap green "Approve" button (✓)
4. **Expected**:
   - Success alert "Post approved successfully"
   - Post disappears from pending
   - Post appears in "Approved Posts" tab

#### Test: Reject Post
1. Go to "Pending" tab
2. Find a post
3. Tap red "Reject" button (✕)
4. **Expected**:
   - Confirmation alert "Are you sure you want to reject this post?"
   - Tap "Reject"
   - Success alert "Post rejected successfully"
   - Post removed from list

### 9. Post Display

For each post, verify:
- [ ] Author avatar or initial
- [ ] Author username (@username)
- [ ] Relative timestamp (e.g., "5m ago", "2h ago")
- [ ] Post content
- [ ] Media images (if any)
- [ ] Pending badge (orange) if not approved

### 10. Edge Cases

#### Test: No Internet Connection
1. Disable network
2. Try to load communities
3. **Expected**: Error alert "Failed to load communities"
4. Pull to refresh
5. **Expected**: Refresh fails with error

#### Test: Long Community Names
1. Create community with long name (near 100 char limit)
2. **Expected**: Name displays without breaking layout

#### Test: Long Descriptions
1. Create community with long description (near 500 char limit)
2. **Expected**: Description truncates to 2 lines with ellipsis

#### Test: No Communities
1. New user with no communities
2. View "My Communities"
3. **Expected**: Empty state with helpful message

#### Test: Private Community Visibility
1. As non-member, view "Public Communities"
2. **Expected**: Private communities don't show Join button

### 11. Performance Tests

#### Test: Large Community List
1. Join/view many communities (20+)
2. Scroll through list
3. **Expected**: Smooth scrolling, no lag

#### Test: Many Pending Posts
1. As admin with many pending posts (10+)
2. View pending tab
3. **Expected**: All posts load without freezing

### 12. Platform-Specific Tests

#### iOS
- [ ] Share sheet uses native iOS design
- [ ] Pull-to-refresh feels native
- [ ] Keyboard behavior is correct

#### Android
- [ ] Share sheet uses native Android design
- [ ] Back button works properly
- [ ] Material design shadows appear

#### Web
- [ ] Share copies to clipboard instead of showing share sheet
- [ ] All interactions work with mouse
- [ ] Keyboard navigation works

## Known Limitations

1. Media upload for posts is not yet implemented (backend ready)
2. Community profile picture upload is not implemented in modal (can be added later)
3. Private communities require manual invitation (join feature disabled for private)

## Success Criteria

All tests should pass with:
- ✅ No app crashes
- ✅ No console errors
- ✅ Proper error messages shown to users
- ✅ All features work as described
- ✅ UI looks polished and professional
- ✅ Data persists across app restarts
- ✅ Pull-to-refresh updates data correctly

## Reporting Issues

When reporting issues, include:
1. Test scenario number
2. Steps to reproduce
3. Expected vs actual behavior
4. Platform (iOS/Android/Web)
5. Screenshots if applicable
6. Console errors if any
