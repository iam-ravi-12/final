# Firebase Storage Integration - Mobile App Updates

## Overview
The mobile app has been updated to work seamlessly with the Firebase Storage integration on the backend. Images are now properly uploaded to Firebase Storage instead of being stored as base64 in the database.

## Changes Made

### 1. New Utility: `utils/imageUtils.ts`
Created a utility module for converting images to base64:
- `convertImageToBase64(uri)` - Converts a local image URI to base64 string
- `convertImagesToBase64(uris)` - Converts multiple images at once

### 2. Updated Dependencies
Added `expo-file-system` to `package.json` for reading local files as base64.

### 3. Updated Screens

#### CreatePostScreen.tsx
- Now converts picked images to base64 before sending to backend
- Shows loading indicator while processing images
- Backend receives base64 and uploads to Firebase Storage

#### EditPostScreen.tsx
- Converts local image URIs to base64 before sending
- Preserves existing Firebase Storage URLs when editing
- Handles both new local images and existing cloud images

#### EditProfileScreen.tsx
- Converts profile picture to base64 before saving
- Shows loading indicator during image processing
- Only converts if image is a local URI (starts with `file://`)

## How It Works

### Image Upload Flow
1. User picks an image using `expo-image-picker`
2. App gets local file URI (e.g., `file:///path/to/image.jpg`)
3. App converts local URI to base64 using `FileSystem.readAsStringAsync()`
4. App sends base64 string to backend API
5. Backend receives base64, uploads to Firebase Storage
6. Backend returns Firebase Storage URL (e.g., `https://storage.googleapis.com/...`)
7. App displays image using Firebase Storage URL

### Image Display Flow
- Images from backend are already Firebase Storage URLs
- App can directly display them using `<Image source={{ uri: url }} />`
- No conversion needed for display

## Installation

After pulling these changes, run:

```bash
npm install
```

This will install the new `expo-file-system` dependency.

## Testing

1. **Create a Post with Image**
   - Go to Create Post screen
   - Add an image
   - Submit the post
   - Verify image displays correctly

2. **Update Profile Picture**
   - Go to Edit Profile
   - Pick a new profile picture
   - Save
   - Verify image displays on profile

3. **Edit Post with Image**
   - Create or open an existing post with an image
   - Edit the post
   - Add/change/remove image
   - Verify changes are saved correctly

## Backend Requirements

The backend must have:
1. `FIREBASE_STORAGE_BUCKET` configured in `application.properties` or as environment variable
2. Firebase Admin SDK credentials available
3. Firebase Storage enabled in Firebase Console

See backend documentation (`FIREBASE_STORAGE_SETUP.md`, `QUICKSTART.md`) for setup instructions.

## Notes

- Images are compressed before upload (quality: 0.8)
- Maximum file size limits should be enforced at backend
- Local file URIs are only valid during the app session
- Always convert to base64 before sending to backend
- Firebase Storage URLs are permanent and can be cached

## Troubleshooting

### Images not uploading
- Check backend logs for Firebase Storage configuration
- Verify `FIREBASE_STORAGE_BUCKET` is set correctly
- Ensure Firebase Admin SDK is initialized

### "Failed to process image" error
- Check file permissions on device
- Verify `expo-file-system` is installed
- Check image file is valid and accessible

### Images not displaying
- Verify backend returns Firebase Storage URLs
- Check network connectivity
- Ensure Firebase Storage rules allow public read access
