package com.social.network.controller;

import com.social.network.service.CloudinaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Accepts binary file uploads from the mobile client and stores them in Cloudinary.
 * This avoids the base64-encoding approach which fails for large video/audio files.
 */
@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MediaUploadController {

    private final CloudinaryService cloudinaryService;

    public MediaUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    /**
     * Upload a media file (image/video/audio) to Cloudinary.
     *
     * @param authentication the authenticated user
     * @param file           the multipart file
     * @param folder         destination folder in Cloudinary (default: "posts")
     * @return JSON with a single "url" key containing the public Cloudinary URL
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadMedia(
            Authentication authentication,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "posts") String folder) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file provided");
        }

        try {
            byte[] bytes = file.getBytes();
            String contentType = file.getContentType();
            String url = cloudinaryService.uploadMedia(bytes, contentType, folder);

            if (url == null) {
                return ResponseEntity.status(500).body("Upload to Cloudinary failed. Check server configuration.");
            }

            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }
}
