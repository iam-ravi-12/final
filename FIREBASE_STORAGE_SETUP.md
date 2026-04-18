# Firebase Storage Setup Guide

This application uses Firebase Storage to store user-uploaded images (profile pictures, post media, community images, etc.) instead of storing them as base64 strings in the database.

## Prerequisites

1. A Firebase project (the same one used for FCM)
2. Firebase Admin SDK credentials (already configured for FCM)

## Configuration Steps

### 1. Enable Firebase Storage in Your Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Storage" in the left sidebar
4. Click "Get Started"
5. Choose your security rules (for now, you can use test mode or configure custom rules)
6. Select a Cloud Storage location
7. Click "Done"

### 2. Configure Storage Bucket Rules

Go to the "Rules" tab in Firebase Storage and update the rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow public read access to all files
      allow read: if true;
      
      // Allow write access only from server (via Admin SDK)
      allow write: if false;
    }
  }
}
```

This configuration allows:
- Public read access (so images can be displayed in the app)
- Write access only through the server using Firebase Admin SDK

### 3. Set Environment Variable

Set the `FIREBASE_STORAGE_BUCKET` environment variable with your bucket name:

**Local Development (.env or IDE configuration):**
```bash
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**Production (Render/Railway/etc.):**
Add the environment variable in your deployment platform:
- Variable name: `FIREBASE_STORAGE_BUCKET`
- Value: `your-project-id.appspot.com`

To find your bucket name:
1. Go to Firebase Console > Storage
2. Look at the bucket URL, it should be something like `gs://your-project-id.appspot.com`
3. Use the part after `gs://` (e.g., `your-project-id.appspot.com`)

### 4. Firebase Admin SDK Credentials

The application uses the same Firebase Admin SDK credentials configured for FCM. Make sure you have one of the following:

1. **Environment Variable (Recommended for Production):**
   - `FIREBASE_CREDENTIALS_BASE64`: Base64-encoded service account JSON

2. **File in Classpath (Local Development):**
   - Place `firebase-service-account.json` in `src/main/resources/`

3. **File in Project Root (Local Development):**
   - Place `firebase-service-account.json` in the project root directory

## How It Works

### Backend Flow

1. **Image Upload:**
   - Frontend sends base64-encoded image to backend
   - Backend decodes base64 and uploads to Firebase Storage
   - Backend saves Firebase Storage URL in database
   - Frontend receives and displays image from Firebase Storage URL

2. **Image Organization:**
   Images are organized in folders:
   - `profiles/` - User profile pictures
   - `posts/` - Post media (images/videos)
   - `communities/` - Community profile pictures
   - `community-posts/` - Community post media

3. **Automatic Cleanup:**
   - When a user updates their profile picture, the old image is deleted
   - When a post is updated or deleted, associated media is deleted
   - This prevents storage bloat and keeps costs down

### Fallback Behavior

If Firebase Storage is not configured (no `FIREBASE_STORAGE_BUCKET` environment variable):
- The application falls back to storing base64 strings in the database
- A warning is logged: "Firebase Storage bucket not configured. Falling back to base64 storage."
- This ensures the application continues to work even without Firebase Storage

## Testing

1. Start the backend with the environment variable set
2. Upload a profile picture through the frontend
3. Check Firebase Console > Storage to see the uploaded image
4. Verify the image displays correctly in the application

## Troubleshooting

### Images not uploading to Firebase Storage

Check the backend logs for warnings:
- "Firebase Storage bucket not configured" - Set the `FIREBASE_STORAGE_BUCKET` environment variable
- "Firebase not initialized" - Check Firebase Admin SDK credentials
- "Firebase Storage bucket not available" - Verify the bucket name is correct

### Images uploading but not displaying

1. Check Firebase Storage rules allow public read access
2. Verify the bucket name doesn't have a typo
3. Check browser console for CORS errors

### Storage costs

Firebase Storage has a free tier:
- 5GB storage
- 1GB/day download
- 20,000/day upload operations

For typical usage with image compression (images are compressed before upload), this should be sufficient for small to medium applications.

## Migration from Base64

If you have existing data with base64-encoded images:
1. The application will continue to display existing base64 images
2. New uploads will use Firebase Storage
3. When users update their profile pictures or posts, old base64 data will be replaced with Firebase URLs

No data migration is required - the transition happens naturally as users interact with the application.
