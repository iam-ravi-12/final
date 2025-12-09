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

## Current Limitation

⚠️ **Important**: Photo upload is currently a UI-only feature. The selected images are not actually uploaded to the server yet because the backend doesn't have a file upload endpoint.

To make photos work, you need to:

### Option 1: Use Public Image URLs (Quick Testing)
Instead of uploading from device, paste a public image URL directly into the `mediaUrl` field:
- Edit `CreatePostScreen.tsx`
- Replace the image picker with a text input for image URLs
- Users can paste URLs like `https://example.com/image.jpg`

### Option 2: Implement Backend File Upload (Recommended)
Add file upload support to your Spring Boot backend:

1. **Add dependencies to `pom.xml`**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

2. **Create FileUploadController.java**:
```java
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {
    
    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file) {
        try {
            // Save file to server (adjust path as needed)
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            String uploadDir = "/uploads/";
            Path path = Paths.get(uploadDir + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());
            
            // Return the URL where the file can be accessed
            String fileUrl = "/uploads/" + fileName;
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }
}
```

3. **Configure static resources in `application.properties`**:
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

4. **Update `CreatePostScreen.tsx`** to upload the image first:
```typescript
const uploadImage = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
};
```

### Option 3: Use Cloud Storage (Production)
For production apps, upload to a cloud service:
- AWS S3
- Google Cloud Storage  
- Cloudinary
- Firebase Storage

## Testing Without Backend Changes

For now, to test the photo feature:

1. Use public image URLs from the internet
2. When creating a post, manually set the mediaUrl to a public URL in the database
3. The mobile app will display these images correctly

## Backend Requirements

The backend needs to support the `mediaUrl` field in:
- `PostRequest` DTO (when creating/updating posts)
- `PostResponse` DTO (when retrieving posts)
- Ensure the `Post` entity has a `mediaUrl` column

This has been added to the TypeScript interfaces in the mobile app.
