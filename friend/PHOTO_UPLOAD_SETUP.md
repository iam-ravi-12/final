# Photo Upload Setup Instructions

## Installation Required

To enable photo uploads in posts, you need to install the `expo-image-picker` package:

```bash
cd friend
npx expo install expo-image-picker
```

## Features Added

1. **Create Post Screen** - Users can now:
   - Select images from their device gallery
   - Preview selected image before posting
   - Remove selected image
   - Post with or without an image

2. **Home Feed** - Posts with images display the image below the post content

3. **Post Detail Screen** - Full post view shows images

4. **Community Posts** - Images are displayed in community posts

## How It Works

- Users tap the "Add Photo" button when creating a post
- The app requests gallery permission
- Users select an image from their device
- The image is displayed with a remove button
- When posting, the image URI is sent with the post

## Note

Currently, image URIs are sent directly to the backend. In a production app, you would:
1. Upload the image to a cloud storage service (e.g., AWS S3, Cloudinary)
2. Get the public URL from the storage service
3. Send that URL to your backend as the `mediaUrl`

## Backend Requirements

The backend needs to support the `mediaUrl` field in:
- `PostData` (when creating/updating posts)
- `PostResponse` (when retrieving posts)

This has been added to the TypeScript interfaces in the mobile app.
