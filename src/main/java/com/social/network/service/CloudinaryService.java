package com.social.network.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for uploading and deleting media files via Cloudinary.
 * Replaces Firebase Storage for all image, video, and audio uploads.
 *
 * <p>Configure with the {@code CLOUDINARY_URL} environment variable in the form:
 * {@code cloudinary://API_KEY:API_SECRET@CLOUD_NAME}
 * or set the three individual variables:
 * {@code CLOUDINARY_CLOUD_NAME}, {@code CLOUDINARY_API_KEY}, {@code CLOUDINARY_API_SECRET}.
 */
@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);

    @Value("${CLOUDINARY_URL:#{null}}")
    private String cloudinaryUrl;

    @Value("${CLOUDINARY_CLOUD_NAME:#{null}}")
    private String cloudName;

    @Value("${CLOUDINARY_API_KEY:#{null}}")
    private String apiKey;

    @Value("${CLOUDINARY_API_SECRET:#{null}}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank()) {
            cloudinary = new Cloudinary(cloudinaryUrl);
            logger.info("Cloudinary configured via CLOUDINARY_URL");
        } else if (cloudName != null && apiKey != null && apiSecret != null) {
            Map<String, String> config = new HashMap<>();
            config.put("cloud_name", cloudName);
            config.put("api_key", apiKey);
            config.put("api_secret", apiSecret);
            cloudinary = new Cloudinary(config);
            logger.info("Cloudinary configured via individual env vars (cloud: {})", cloudName);
        } else {
            logger.warn("Cloudinary not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.");
        }
    }

    /**
     * Upload raw bytes to Cloudinary.
     *
     * @param bytes       the file bytes
     * @param contentType MIME type (e.g. "image/jpeg", "video/mp4", "audio/mpeg")
     * @param folder      destination folder inside Cloudinary (e.g. "posts")
     * @return the secure public URL, or {@code null} if the upload fails
     */
    public String uploadMedia(byte[] bytes, String contentType, String folder) {
        if (bytes == null || bytes.length == 0) {
            logger.warn("Attempted to upload null or empty bytes");
            throw new RuntimeException("No file bytes provided");
        }
        if (cloudinary == null) {
            logger.warn("Cloudinary not configured – cannot upload media");
            throw new RuntimeException(
                    "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET on the server.");
        }

        try {
            String resourceType = resolveResourceType(contentType);
            String publicId = folder + "/" + UUID.randomUUID();

            Map<?, ?> result = cloudinary.uploader().upload(
                    bytes,
                    ObjectUtils.asMap(
                            "resource_type", resourceType,
                            "public_id", publicId,
                            "overwrite", true,
                            "timeout", 60   // 60 s socket timeout for the upload HTTP call
                    )
            );

            String url = (String) result.get("secure_url");
            if (url == null) {
                logger.error("Cloudinary upload returned no secure_url. Full result: {}", result);
                throw new RuntimeException("Cloudinary did not return a URL");
            }
            logger.info("Uploaded media to Cloudinary: {}", url);
            return url;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error uploading media to Cloudinary", e);
            throw new RuntimeException("Cloudinary upload error: " + e.getMessage(), e);
        }
    }

    /**
     * Upload a base64-encoded image (data URI or raw base64) to Cloudinary.
     * Falls back to returning the original value when Cloudinary is not configured
     * (matches previous Firebase behaviour so existing data-URI posts still render).
     *
     * @param base64Image data URI or raw base64 string
     * @param folder      destination folder (e.g. "profiles", "posts")
     * @return the secure public URL, or the original value as a fallback
     */
    public String uploadImage(String base64Image, String folder) {
        if (base64Image == null || base64Image.isEmpty()) {
            logger.warn("Attempted to upload null or empty image");
            return null;
        }
        if (cloudinary == null) {
            logger.warn("Cloudinary not configured – falling back to base64 storage");
            return base64Image;
        }

        try {
            // Strip data-URI prefix if present and extract MIME type
            String base64Data = base64Image;
            String contentType = "image/jpeg";
            if (base64Image.contains(",")) {
                String[] parts = base64Image.split(",", 2);
                base64Data = parts[1];
                if (parts[0].contains(":") && parts[0].contains(";")) {
                    contentType = parts[0].substring(parts[0].indexOf(':') + 1, parts[0].indexOf(';'));
                }
            }

            byte[] bytes = Base64.getDecoder().decode(base64Data);
            return uploadMedia(bytes, contentType, folder);
        } catch (Exception e) {
            logger.error("Error uploading base64 image to Cloudinary – falling back to base64", e);
            return base64Image;
        }
    }

    /**
     * Delete a media asset from Cloudinary by its public URL.
     *
     * @param mediaUrl the Cloudinary secure_url returned at upload time
     * @return {@code true} if deletion succeeded
     */
    public boolean deleteMedia(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isEmpty()) {
            return false;
        }
        if (cloudinary == null) {
            logger.warn("Cloudinary not configured – cannot delete media");
            return false;
        }
        if (!mediaUrl.contains("cloudinary.com")) {
            logger.info("Not a Cloudinary URL, skipping deletion: {}", mediaUrl);
            return false;
        }

        try {
            String publicId = extractPublicId(mediaUrl);
            if (publicId == null) {
                logger.warn("Could not extract public ID from URL: {}", mediaUrl);
                return false;
            }

            String resourceType = resolveResourceTypeFromUrl(mediaUrl);
            Map<?, ?> result = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", resourceType)
            );

            boolean ok = "ok".equals(result.get("result"));
            if (ok) {
                logger.info("Deleted Cloudinary asset: {}", publicId);
            } else {
                logger.warn("Cloudinary deletion returned: {} for publicId: {}", result.get("result"), publicId);
            }
            return ok;
        } catch (Exception e) {
            logger.error("Error deleting media from Cloudinary", e);
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Map a MIME type to a Cloudinary resource_type string.
     * Cloudinary accepts "image", "video" (also covers audio), or "raw".
     */
    private String resolveResourceType(String contentType) {
        if (contentType == null) return "raw";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/") || contentType.startsWith("audio/")) return "video";
        return "raw";
    }

    /**
     * Guess the resource type from a Cloudinary URL path segment.
     * Cloudinary URLs contain /image/upload/, /video/upload/, or /raw/upload/.
     */
    private String resolveResourceTypeFromUrl(String url) {
        if (url.contains("/video/upload/")) return "video";
        if (url.contains("/raw/upload/")) return "raw";
        return "image";
    }

    /**
     * Extract the public_id from a Cloudinary URL.
     *
     * <p>Example URL:
     * {@code https://res.cloudinary.com/cloud/image/upload/v123456/posts/uuid.jpg}
     * → public_id: {@code posts/uuid}
     */
    private String extractPublicId(String url) {
        try {
            // Strip query string
            String path = url.split("\\?")[0];
            // Find "/upload/" segment
            int uploadIdx = path.indexOf("/upload/");
            if (uploadIdx == -1) return null;
            String afterUpload = path.substring(uploadIdx + 8); // skip "/upload/"
            // Skip optional version segment "v12345/"
            if (afterUpload.matches("v\\d+/.*")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
            }
            // Remove file extension
            int dotIdx = afterUpload.lastIndexOf('.');
            if (dotIdx != -1) {
                afterUpload = afterUpload.substring(0, dotIdx);
            }
            return afterUpload;
        } catch (Exception e) {
            logger.error("Error extracting public_id from URL: {}", url, e);
            return null;
        }
    }
}
