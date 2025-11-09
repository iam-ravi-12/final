package com.social.network.controller;

import com.social.network.dto.CommunityPostRequest;
import com.social.network.dto.CommunityPostResponse;
import com.social.network.dto.CommunityRequest;
import com.social.network.dto.CommunityResponse;
import com.social.network.security.UserDetailsImpl;
import com.social.network.service.CommunityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communities")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CommunityController {

    private final CommunityService communityService;

    public CommunityController(CommunityService communityService) {
        this.communityService = communityService;
    }

    @PostMapping
    public ResponseEntity<?> createCommunity(
            Authentication authentication,
            @Valid @RequestBody CommunityRequest request) {
        try {
            String username = authentication.getName();
            CommunityResponse response = communityService.createCommunity(username, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/public")
    public ResponseEntity<?> getAllPublicCommunities(Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<CommunityResponse> communities = communityService.getAllPublicCommunities(userDetails.getId());
            return ResponseEntity.ok(communities);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyCommunities(Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<CommunityResponse> communities = communityService.getUserCommunities(userDetails.getId());
            return ResponseEntity.ok(communities);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{communityId}")
    public ResponseEntity<?> getCommunityById(
            @PathVariable Long communityId,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            CommunityResponse community = communityService.getCommunityById(communityId, userDetails.getId());
            return ResponseEntity.ok(community);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{communityId}/join")
    public ResponseEntity<?> joinCommunity(
            @PathVariable Long communityId,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            communityService.joinCommunity(communityId, userDetails.getId());
            return ResponseEntity.ok("Joined community successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{communityId}/leave")
    public ResponseEntity<?> leaveCommunity(
            @PathVariable Long communityId,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            communityService.leaveCommunity(communityId, userDetails.getId());
            return ResponseEntity.ok("Left community successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{communityId}/posts")
    public ResponseEntity<?> createPost(
            @PathVariable Long communityId,
            Authentication authentication,
            @Valid @RequestBody CommunityPostRequest request) {
        try {
            String username = authentication.getName();
            CommunityPostResponse response = communityService.createPost(communityId, username, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{communityId}/posts")
    public ResponseEntity<?> getCommunityPosts(
            @PathVariable Long communityId,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<CommunityPostResponse> posts = communityService.getCommunityPosts(communityId, userDetails.getId());
            return ResponseEntity.ok(posts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{communityId}/posts/pending")
    public ResponseEntity<?> getPendingPosts(
            @PathVariable Long communityId,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<CommunityPostResponse> posts = communityService.getPendingPosts(communityId, userDetails.getId());
            return ResponseEntity.ok(posts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/posts/{postId}/approve")
    public ResponseEntity<?> approvePost(
            @PathVariable Long postId,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            communityService.approvePost(postId, userDetails.getId());
            return ResponseEntity.ok("Post approved successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/posts/{postId}/reject")
    public ResponseEntity<?> rejectPost(
            @PathVariable Long postId,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            communityService.rejectPost(postId, userDetails.getId());
            return ResponseEntity.ok("Post rejected successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
