# Multiple Image Upload Feature

## Overview
This feature allows users to upload up to 4 images per post with automatic compression and carousel display.

## Implementation Details

### Frontend (React Native)

#### Components
- **ImageCarousel**: Reusable component for displaying multiple images with swipe navigation and indicators
  - Location: `/friend/components/ImageCarousel.tsx`
  - Features:
    - Horizontal swipeable gallery
    - Dot indicators showing current position
    - Configurable height and border radius
    - Automatic pagination

#### Image Compression
- **Library**: expo-image-manipulator
- **Settings**:
  - Quality: 70% (0.7)
  - Max dimensions: 1200x1200 pixels
  - Format: JPEG
- **Benefits**:
  - Faster uploads
  - Reduced bandwidth usage
  - Optimized app performance

#### User Experience
1. **Image Selection**:
   - Tap "Add Photos" button in Create Post screen
   - Select up to 4 images from gallery
   - Selected images are automatically compressed
   - Preview shown in horizontal scrollable list
   - Individual images can be removed

2. **Image Upload**:
   - Images are uploaded to backend before post creation
   - Progress indication during upload
   - Error handling for failed uploads

3. **Image Display**:
   - All post views use ImageCarousel component
   - Swipe left/right to view multiple images
   - Dot indicators show current position
   - Consistent experience across all screens

### Backend (Spring Boot)

#### Endpoints

##### Upload Single Image
```
POST /api/upload/image
Content-Type: multipart/form-data
Parameter: file (MultipartFile)

Response:
{
  "url": "/uploads/uuid-filename.jpg"
}
```

##### Upload Multiple Images
```
POST /api/upload/images
Content-Type: multipart/form-data
Parameter: files (MultipartFile[])

Response:
{
  "urls": ["/uploads/uuid-1.jpg", "/uploads/uuid-2.jpg"],
  "errors": [] // Only present if some files failed
}
```

#### Validation
- **File Type**: Images only (checks Content-Type)
- **File Size**: Maximum 5MB per image
- **Count**: Maximum 4 images per upload
- **Error Handling**: Individual file failures are reported without affecting other uploads

#### Storage
- **Directory**: `./uploads` (configurable via `file.upload-dir` property)
- **Naming**: UUID-based to prevent conflicts
- **Static Serving**: Files served via `/uploads/**` path
- **Security**: Directory is gitignored to prevent committing uploaded files

#### Configuration
In `application.properties`:
```properties
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=20MB
file.upload-dir=./uploads
```

### Database Schema
The `posts` table already supports multiple images via the `media_urls` column (TEXT type).
Images are stored as pipe-separated URLs using delimiter `|||MEDIA_SEPARATOR|||`.

## Updated Screens
1. **CreatePostScreen**: Image selection and upload
2. **HomeScreen**: Post cards with carousel
3. **PostDetailScreen**: Full post view with carousel
4. **UserProfileScreen**: User posts with carousel
5. **CommunityPostsScreen**: Community posts with carousel

## Testing Checklist
- [ ] Select single image for post
- [ ] Select multiple images (up to 4)
- [ ] Try to select more than 4 images (should show limit message)
- [ ] Remove individual images from selection
- [ ] Verify image compression reduces file size
- [ ] Upload images and create post
- [ ] View post with single image
- [ ] View post with multiple images
- [ ] Swipe through images in carousel
- [ ] Verify carousel works on Home feed
- [ ] Verify carousel works on Post detail page
- [ ] Verify carousel works on Profile page
- [ ] Verify carousel works on Community posts
- [ ] Test with slow network connection
- [ ] Test upload failure handling
- [ ] Verify images persist after app restart

## Known Limitations
1. Images must be uploaded from the mobile app - no direct URL input
2. Images are stored on the server's local filesystem (not cloud storage)
3. No image editing features (crop, rotate, filters)
4. No option to reorder selected images

## Future Enhancements
1. Cloud storage integration (AWS S3, Google Cloud Storage, Cloudinary)
2. Image editing before upload (crop, rotate, filters)
3. Drag-and-drop to reorder images
4. Video upload support
5. Image deletion after post creation
6. Automatic thumbnail generation
7. Lazy loading for better performance
8. Full-screen image viewer with pinch-to-zoom
