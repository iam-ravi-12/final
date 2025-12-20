# Firebase Storage Integration - Mobile App Updates

## Overview
The mobile app has been updated to work seamlessly with the Firebase Storage integration on the backend. Images are now properly uploaded to Firebase Storage instead of being stored as base64 in the database.

## Changes Made

### 1. Updated Screens

#### CreatePostScreen.tsx
- Uses `expo-image-picker` with `base64: true` option
- Gets base64 data directly from the picker
- Sends base64 to backend which uploads to Firebase Storage
- No additional file reading or conversion needed

#### EditPostScreen.tsx
- Uses `expo-image-picker` with `base64: true` option
- Handles both new local images (base64) and existing Firebase URLs
- Preserves existing Firebase Storage URLs when editing

#### EditProfileScreen.tsx
- Uses `expo-image-picker` with `base64: true` option
- Gets base64 data directly from the picker
- Sends to backend which uploads to Firebase Storage

### 2. Removed Utilities

The `utils/imageUtils.ts` file is no longer needed since we get base64 directly from the image picker.

### 3. Dependencies

No additional dependencies needed beyond `expo-image-picker` (already installed).

## How It Works

### Image Upload Flow
1. User picks an image using `expo-image-picker` with `base64: true`
2. Picker returns both URI (for display) and base64 (for upload)
3. App stores both values
4. App sends base64 string with data URI prefix to backend API
5. Backend receives base64, uploads to Firebase Storage
6. Backend returns Firebase Storage URL (e.g., `https://storage.googleapis.com/...`)
7. App displays image using Firebase Storage URL

### Image Display Flow
- Images from backend are already Firebase Storage URLs
- App can directly display them using `<Image source={{ uri: url }} />`
- No conversion needed for display

## Installation

No additional installation needed. The app uses only:
- `expo-image-picker` (already in dependencies)

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
- Image picker includes `base64: true` option to get base64 directly
- Backend handles all Firebase Storage operations
- Firebase Storage URLs are permanent and can be cached

## Troubleshooting

### Images not uploading
- Check backend logs for Firebase Storage configuration
- Verify `FIREBASE_STORAGE_BUCKET` is set correctly
- Ensure Firebase Admin SDK is initialized

### "Failed to create post" with image
- Check that `base64: true` is set in image picker options
- Verify the image picker is returning base64 data
- Check backend logs for upload errors

### Images not displaying
- Verify backend returns Firebase Storage URLs
- Check network connectivity
- Ensure Firebase Storage rules allow public read access
