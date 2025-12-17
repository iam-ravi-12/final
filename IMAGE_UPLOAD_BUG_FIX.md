# Image Upload Bug Fix

## Issue
When selecting multiple images and clicking "Post", the app would show "Posting..." but then return to the create post screen without actually posting. The images were being selected and compressed successfully, but the upload to the server was failing.

## Root Cause
The issue was with how FormData was being handled in the React Native app:

1. **Default Content-Type Override**: The axios instance was configured with a default `Content-Type: application/json` header. When uploading files with FormData, this header needs to be either removed or set to `multipart/form-data` with the proper boundary parameter.

2. **React Native FormData Specifics**: In React Native, when using FormData for file uploads, the Content-Type header should be automatically set by the underlying networking layer (XMLHttpRequest or fetch) to include the correct boundary parameter. Manually setting it can cause issues.

## Solution

### 1. Modified API Interceptor (`friend/services/api.ts`)
Added logic to detect FormData and remove the Content-Type header:

```typescript
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type if it's FormData
    // Let axios/react-native handle the Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 2. Updated uploadImages Method (`friend/services/postService.ts`)
- Removed explicit `Content-Type: multipart/form-data` header setting
- Let React Native/axios automatically set the header with proper boundary
- Added comprehensive error logging for debugging
- Increased timeout to 60 seconds for large uploads

```typescript
const config = {
  timeout: 60000, // 60 seconds
};

const response = await api.post('/api/upload/images', formData, config);
```

### 3. Enhanced Error Handling (`friend/screens/CreatePostScreen.tsx`)
- Added detailed console logging at each step
- Improved error messages to show actual error details
- Better feedback to users when uploads fail

## Testing

### To test the fix:

1. **Open the app** and navigate to Create Post
2. **Add content** - Type some text for the post
3. **Select images** - Tap "Add Photos" and select 1-4 images
4. **Verify compression** - Check console logs for compression messages
5. **Post** - Tap the "Post" button
6. **Check logs** - Look for these console messages:
   - "Starting image upload... X images"
   - "Uploading X image(s) to server..."
   - "Appending file to FormData: {uri, type, name}"
   - "Upload successful: {urls: [...]}"
   - "Images uploaded successfully: [...]"
   - "Creating post with data: {...}"

7. **Verify success** - Should see "Post created successfully!" alert
8. **Check home feed** - New post should appear with images in carousel

### Expected Console Output:
```
Starting image upload... 2 images
Appending file to FormData: {uri: "file://...", type: "image/jpeg", name: "..."}
Appending file to FormData: {uri: "file://...", type: "image/jpeg", name: "..."}
Uploading 2 image(s) to server...
Upload successful: {urls: ["/uploads/uuid-1.jpg", "/uploads/uuid-2.jpg"], errors: []}
Images uploaded successfully: ["/uploads/uuid-1.jpg", "/uploads/uuid-2.jpg"]
Creating post with data: {content: "...", isHelpSection: false, showInHome: true, mediaUrls: [...]}
```

### If Upload Still Fails:

Check console for error messages:
- **Network error**: Check internet connection and API URL
- **401 Unauthorized**: Token may have expired, try logging out and back in
- **400 Bad Request**: Check server logs for validation errors
- **500 Server Error**: Backend may not be running or has issues

### Common Issues:

1. **Backend not running**: Ensure the Spring Boot backend is running and accessible at the API URL
2. **File permissions**: On some devices, additional permissions may be needed
3. **File size**: Ensure individual images don't exceed 5MB after compression
4. **Network timeout**: Large images may take longer - timeout is set to 60 seconds

## Technical Details

### Why This Fix Works

**React Native FormData Behavior**:
- When you create a FormData object in React Native and append file objects with `uri`, `type`, and `name` properties, the networking layer needs to:
  1. Read the file from the local file system using the URI
  2. Create a multipart request with proper boundaries
  3. Set the Content-Type header with the boundary parameter

**Boundary Parameter**:
- Multipart requests need a unique boundary string to separate different parts
- Example: `Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXXXXXXXX`
- When you manually set `Content-Type: multipart/form-data`, you omit the boundary
- The server can't parse the request without the boundary

**Solution**:
- By removing the Content-Type header, we let the React Native networking layer (which uses native code) automatically set it with the correct boundary
- This is the recommended approach for React Native file uploads

## Related Files Modified

1. `friend/services/api.ts` - Fixed axios interceptor
2. `friend/services/postService.ts` - Fixed uploadImages method
3. `friend/screens/CreatePostScreen.tsx` - Enhanced error handling and logging

## Commit Hash
0777b86 - Fix image upload: handle FormData Content-Type properly and improve error logging
