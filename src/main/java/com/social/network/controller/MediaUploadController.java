package com.social.network.controller;

import com.social.network.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Accepts binary file uploads from the mobile client and stores them in Cloudinary.
 *
 * <p>Handles photos and videos captured directly with the device camera as well
 * as files selected from the media gallery or audio picker.
 *
 * <p>The multipart {@code Content-Type} header is used as the primary MIME type
 * source.  When it is missing or reported as {@code application/octet-stream},
 * the file extension embedded in the original filename is used as a reliable
 * fallback (important for iOS camera recordings which arrive as {@code .mov}
 * files and for Android camera recordings that arrive as {@code .mp4}).
 */
@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MediaUploadController {

    private static final Logger logger = LoggerFactory.getLogger(MediaUploadController.class);

    /** Hard cap: reject uploads larger than 500 MB to protect the server. */
    private static final long MAX_BYTES = 500L * 1024 * 1024;

    private final CloudinaryService cloudinaryService;

    public MediaUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    /**
     * Upload a media file (image / video / audio) to Cloudinary.
     *
     * @param authentication the authenticated user (required)
     * @param file           the multipart file sent by the client
     * @param folder         destination folder inside Cloudinary (default: "posts")
     * @return {@code 200 OK} with {@code { "url": "<cloudinary-url>" }}
     *         or an appropriate error status
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadMedia(
            Authentication authentication,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "posts") String folder) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No file provided"));
        }

        if (file.getSize() > MAX_BYTES) {
            return ResponseEntity.status(413).body(
                    Map.of("error", "File too large. Maximum allowed size is 500 MB."));
        }

        try {
            byte[] bytes = file.getBytes();

            // Resolve the effective MIME type: prefer the multipart header, but
            // fall back to extension-based detection when the header is absent or
            // is the unhelpful generic "application/octet-stream".
            String contentType = resolveContentType(file);
            logger.info("Media upload: filename='{}', declaredType='{}', resolvedType='{}', size={}B, folder='{}', user='{}'",
                    file.getOriginalFilename(),
                    file.getContentType(),
                    contentType,
                    bytes.length,
                    folder,
                    authentication.getName());

            String url = cloudinaryService.uploadMedia(bytes, contentType, folder);
            logger.info("Media uploaded successfully by '{}': {}", authentication.getName(), url);

            return ResponseEntity.ok(Map.of(
                    "url", url,
                    "contentType", contentType,
                    "sizeBytes", bytes.length
            ));

        } catch (Exception e) {
            logger.error("Media upload failed for user '{}': {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Determine the effective MIME type for the uploaded file.
     *
     * <ol>
     *   <li>Use the multipart {@code Content-Type} header when it is present and
     *       not {@code application/octet-stream}.</li>
     *   <li>Otherwise derive the type from the file extension.
     *       This handles the common cases of iOS (.mov, .heic) and Android (.mp4)
     *       camera captures whose headers are sometimes stripped or wrong.</li>
     *   <li>Fall back to {@code application/octet-stream} as a last resort.</li>
     * </ol>
     */
    private String resolveContentType(MultipartFile file) {
        String declared = file.getContentType();
        if (declared != null && !declared.isBlank() && !"application/octet-stream".equals(declared)) {
            return declared;
        }

        // Fall back to extension-based detection
        String filename = file.getOriginalFilename();
        if (filename != null && filename.contains(".")) {
            String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            return switch (ext) {
                // ── Images ────────────────────────────────────────────────────
                case "jpg", "jpeg" -> "image/jpeg";
                case "png"         -> "image/png";
                case "gif"         -> "image/gif";
                case "webp"        -> "image/webp";
                case "heic"        -> "image/heic";
                case "heif"        -> "image/heif";
                // ── Videos ────────────────────────────────────────────────────
                case "mp4"         -> "video/mp4";
                case "mov"         -> "video/quicktime";   // iOS camera default
                case "avi"         -> "video/x-msvideo";
                case "mkv"         -> "video/x-matroska";
                case "webm"        -> "video/webm";
                case "3gp"         -> "video/3gpp";
                // ── Audio ─────────────────────────────────────────────────────
                case "mp3"         -> "audio/mpeg";
                case "m4a"         -> "audio/x-m4a";
                case "aac"         -> "audio/aac";
                case "wav"         -> "audio/wav";
                case "ogg"         -> "audio/ogg";
                case "flac"        -> "audio/flac";
                // ── Documents ─────────────────────────────────────────────────
                case "pdf"         -> "application/pdf";
                default            -> "application/octet-stream";
            };
        }

        return "application/octet-stream";
    }
}
