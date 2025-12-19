package com.social.network.service;

import com.google.cloud.storage.*;
import com.google.firebase.cloud.StorageClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

@Service
public class FirebaseStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseStorageService.class);
    
    @Value("${FIREBASE_STORAGE_BUCKET:#{null}}")
    private String bucketName;

    /**
     * Upload a base64 encoded image to Firebase Storage
     * 
     * @param base64Image The base64 encoded image string (with or without data URI prefix)
     * @param folder The folder path in Firebase Storage (e.g., "profiles", "posts")
     * @return The public URL of the uploaded image, or null if upload fails
     */
    public String uploadImage(String base64Image, String folder) {
        if (base64Image == null || base64Image.isEmpty()) {
            logger.warn("Attempted to upload null or empty image");
            return null;
        }

        // Check if Firebase Storage is configured
        if (bucketName == null || bucketName.isEmpty()) {
            logger.warn("Firebase Storage bucket not configured. Falling back to base64 storage.");
            return base64Image; // Return base64 as fallback
        }

        try {
            // Check if StorageClient is initialized
            Bucket bucket = StorageClient.getInstance().bucket(bucketName);
            if (bucket == null) {
                logger.warn("Firebase Storage bucket not available. Falling back to base64 storage.");
                return base64Image;
            }

            // Remove data URI prefix if present (e.g., "data:image/png;base64,")
            String base64Data = base64Image;
            String contentType = "image/jpeg"; // Default
            
            if (base64Image.contains(",")) {
                String[] parts = base64Image.split(",", 2);
                base64Data = parts[1];
                
                // Extract content type from data URI
                if (parts[0].contains(":") && parts[0].contains(";")) {
                    String dataUri = parts[0];
                    contentType = dataUri.substring(dataUri.indexOf(":") + 1, dataUri.indexOf(";"));
                }
            }

            // Decode base64 to bytes
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);

            // Generate unique filename
            String filename = folder + "/" + UUID.randomUUID().toString() + getFileExtension(contentType);

            // Upload to Firebase Storage using bucket
            Blob blob = bucket.create(filename, imageBytes, contentType);

            // Generate public URL (tokens not required for public buckets)
            String publicUrl = String.format("https://storage.googleapis.com/%s/%s", bucketName, filename);
            
            logger.info("Successfully uploaded image to Firebase Storage: {}", publicUrl);
            return publicUrl;

        } catch (IllegalStateException e) {
            logger.error("Firebase not initialized. Falling back to base64 storage.", e);
            return base64Image;
        } catch (Exception e) {
            logger.error("Error uploading image to Firebase Storage. Falling back to base64.", e);
            return base64Image;
        }
    }

    /**
     * Delete an image from Firebase Storage
     * 
     * @param imageUrl The public URL of the image to delete
     * @return true if deletion was successful, false otherwise
     */
    public boolean deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return false;
        }

        // Check if it's a Firebase Storage URL
        if (!imageUrl.contains("storage.googleapis.com") && !imageUrl.contains("firebasestorage.googleapis.com")) {
            logger.info("Not a Firebase Storage URL, skipping deletion: {}", imageUrl);
            return false;
        }

        // Check if Firebase Storage is configured
        if (bucketName == null || bucketName.isEmpty()) {
            logger.warn("Firebase Storage bucket not configured");
            return false;
        }

        try {
            Bucket bucket = StorageClient.getInstance().bucket(bucketName);
            if (bucket == null) {
                logger.warn("Firebase Storage bucket not available");
                return false;
            }

            // Extract filename from URL
            String filename = extractFilenameFromUrl(imageUrl);
            if (filename == null) {
                logger.warn("Could not extract filename from URL: {}", imageUrl);
                return false;
            }

            // Delete from Firebase Storage
            Blob blob = bucket.get(filename);
            if (blob != null && blob.exists()) {
                boolean deleted = blob.delete();
                if (deleted) {
                    logger.info("Successfully deleted image from Firebase Storage: {}", filename);
                } else {
                    logger.warn("Failed to delete image from Firebase Storage: {}", filename);
                }
                return deleted;
            } else {
                logger.warn("Image not found in Firebase Storage: {}", filename);
                return false;
            }

        } catch (IllegalStateException e) {
            logger.error("Firebase not initialized", e);
            return false;
        } catch (Exception e) {
            logger.error("Error deleting image from Firebase Storage", e);
            return false;
        }
    }

    /**
     * Get file extension based on content type
     */
    private String getFileExtension(String contentType) {
        switch (contentType) {
            case "image/jpeg":
            case "image/jpg":
                return ".jpg";
            case "image/png":
                return ".png";
            case "image/gif":
                return ".gif";
            case "image/webp":
                return ".webp";
            case "video/mp4":
                return ".mp4";
            case "video/webm":
                return ".webm";
            default:
                return ".jpg";
        }
    }

    /**
     * Extract filename from Firebase Storage URL
     */
    private String extractFilenameFromUrl(String url) {
        try {
            // Handle both formats:
            // https://storage.googleapis.com/bucket-name/path/file.jpg
            // https://firebasestorage.googleapis.com/v0/b/bucket-name/o/path%2Ffile.jpg?...
            
            if (url.contains("storage.googleapis.com")) {
                // Extract path after bucket name
                String[] parts = url.split(bucketName + "/", 2);
                if (parts.length == 2) {
                    return parts[1].split("\\?")[0]; // Remove query params if any
                }
            } else if (url.contains("firebasestorage.googleapis.com")) {
                // Extract encoded path
                String[] parts = url.split("/o/", 2);
                if (parts.length == 2) {
                    String encodedPath = parts[1].split("\\?")[0];
                    return java.net.URLDecoder.decode(encodedPath, StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            logger.error("Error extracting filename from URL", e);
        }
        return null;
    }
}
