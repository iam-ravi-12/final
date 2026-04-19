package com.social.network.controller;

import com.social.network.service.FirebaseStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Accepts binary file uploads from the mobile client and stores them in Firebase Storage.
 * This avoids the base64-encoding approach which fails for large video/audio files.
 */
@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MediaUploadController {

    private final FirebaseStorageService firebaseStorageService;

    public MediaUploadController(FirebaseStorageService firebaseStorageService) {
        this.firebaseStorageService = firebaseStorageService;
    }

    /**
     * Upload a media file (image/video/audio) to Firebase Storage.
     *
     * @param authentication the authenticated user
     * @param file           the multipart file
     * @param folder         destination folder in Firebase Storage (default: "posts")
     * @return JSON with a single "url" key containing the public Firebase Storage URL
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
            String url = firebaseStorageService.uploadMedia(bytes, contentType, folder);

            if (url == null) {
                return ResponseEntity.status(500).body("Upload to Firebase Storage failed. Check server configuration.");
            }

            return ResponseEntity.ok(Map.of("url", url));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }
}
