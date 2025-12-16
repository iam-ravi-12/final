# Posts Tab with Show More Feature

## What Changed

Added a new "Posts" tab in the admin panel that displays all posts with details and a "Show More" button to view the complete post content.

## Features

### 1. Posts Tab
A new tab between "Users" and "Communities" that shows all posts in the system.

### 2. Posts Table
Displays a comprehensive list of all posts with:
- **ID**: Post identifier
- **User**: Author name and username
- **Content Preview**: First 100 characters of the post
- **Type**: Badge showing "Help" or "Post"
- **Status**: Shows if help is solved/unsolved, or if post is hidden
- **Created**: Timestamp when the post was created
- **Actions**: "Show More" button to view full details

### 3. Show More Modal
Clicking "Show More" opens a detailed modal showing:

**Author Information:**
- Name
- Username
- Profession

**Post Information:**
- Type (Help Request or Regular Post)
- Solved status (for help posts)
- Visibility (Visible or Hidden)
- Created and Updated timestamps

**Full Content:**
- Complete post text in a scrollable container
- Preserves formatting with pre-wrap

**Media:**
- Displays media URLs if attached

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Admin Panel                                         [ Logout ]          │
├─────────────────────────────────────────────────────────────────────────┤
│  [ Users ] [Posts] [ Communities ] [ SOS Requests ]                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  All Posts (45)                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ID │ User    │ Content Preview      │ Type │ Status │ Actions  │   │
│  ├────┼─────────┼──────────────────────┼──────┼────────┼──────────┤   │
│  │ 15 │ John    │ Looking for help... │ Help │ Unsolved│[Show More]│   │
│  │ 14 │ Jane    │ Great day today...  │ Post │        │[Show More]│   │
│  │ 13 │ Bob     │ Need assistance...  │ Help │ Solved │[Show More]│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

When "Show More" is clicked:
┌──────────────────────────────────────────┐
│  Post Details (ID: 15)              [ × ]│
├──────────────────────────────────────────┤
│  Author                                  │
│  Name: John Doe                          │
│  Username: @john_doe                     │
│  Profession: Software Engineer           │
│                                          │
│  Post Information                        │
│  Type: Help Request                      │
│  Solved: No                              │
│  Visibility: Visible                     │
│  Created: 2025-12-16 10:30 AM            │
│                                          │
│  Full Content                            │
│  ┌────────────────────────────────────┐  │
│  │ Looking for help with React...     │  │
│  │ I'm trying to implement a new      │  │
│  │ feature but facing issues...       │  │
│  │ [Full post content displayed]      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Status Badges

**Post Types:**
- 🟨 **Help** - Yellow background for help requests
- 🔵 **Post** - Blue background for regular posts

**Help Status:**
- 🟢 **Solved** - Green for resolved help requests
- 🔴 **Unsolved** - Red for pending help requests

**Visibility:**
- ⚪ **Hidden** - Gray badge for hidden posts

## Backend API

### New Endpoint
- `GET /api/admin/posts` - Returns all posts with full details

**Response Format:**
```json
[
  {
    "id": 15,
    "content": "Full post content...",
    "mediaUrls": "http://...",
    "isHelpSection": true,
    "isSolved": false,
    "showInHome": true,
    "userId": 5,
    "userName": "John Doe",
    "userUsername": "john_doe",
    "userProfession": "Software Engineer",
    "createdAt": "2025-12-16T10:30:00",
    "updatedAt": "2025-12-16T10:30:00"
  }
]
```

## Frontend Components

### State Management
```javascript
const [posts, setPosts] = useState([]);
const [selectedPost, setSelectedPost] = useState(null);
```

### Service Method
```javascript
getAllPosts: async () => {
  const response = await api.get('/admin/posts');
  return response.data;
}
```

## Benefits

1. **Content Moderation**: Admins can review all posts
2. **Help Tracking**: Easy to see which help requests are solved/unsolved
3. **User Activity**: Monitor what users are posting
4. **Full Context**: "Show More" provides complete post details
5. **Efficient Layout**: Table view shows key info at a glance

## Files Modified

1. **AdminController.java**: Added `GET /api/admin/posts` endpoint
2. **adminService.js**: Added `getAllPosts()` method
3. **AdminDashboard.js**: 
   - Added Posts tab
   - Added posts table with content preview
   - Added "Show More" modal with full post details
4. **Admin.css**: Existing styles work with new components

## Usage

1. Login to admin panel
2. Click "Posts" tab
3. View all posts with preview in table
4. Click "Show More" on any post to see:
   - Full content
   - Author details
   - Post metadata
   - Media attachments
5. Click "×" or outside modal to close

## Technical Details

- **Content Preview**: Truncates to 100 characters with ellipsis
- **Modal**: Uses existing modal styles for consistency
- **Scrollable Content**: Long posts scroll within modal
- **Responsive**: Works on all screen sizes
- **Pre-wrap**: Preserves text formatting in full content view
