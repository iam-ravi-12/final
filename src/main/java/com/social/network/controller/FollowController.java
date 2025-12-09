package com.social.network.controller;

import com.social.network.dto.FollowResponse;
import com.social.network.dto.FollowStatsResponse;
import com.social.network.service.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/follows")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/send/{userId}")
    public ResponseEntity<?> sendFollowRequest(
            @PathVariable Long userId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            followService.sendFollowRequest(username, userId);
            return ResponseEntity.ok("Follow request sent");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accept/{followId}")
    public ResponseEntity<?> acceptFollowRequest(
            @PathVariable Long followId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            followService.acceptFollowRequest(followId, username);
            return ResponseEntity.ok("Follow request accepted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reject/{followId}")
    public ResponseEntity<?> rejectFollowRequest(
            @PathVariable Long followId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            followService.rejectFollowRequest(followId, username);
            return ResponseEntity.ok("Follow request rejected");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/unfollow/{userId}")
    public ResponseEntity<?> unfollow(
            @PathVariable Long userId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            followService.unfollow(username, userId);
            return ResponseEntity.ok("Unfollowed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/followers/{userId}")
    public ResponseEntity<?> getFollowers(@PathVariable Long userId) {
        try {
            List<FollowResponse> followers = followService.getFollowers(userId);
            return ResponseEntity.ok(followers);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<?> getFollowing(@PathVariable Long userId) {
        try {
            List<FollowResponse> following = followService.getFollowing(userId);
            return ResponseEntity.ok(following);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<FollowResponse> pending = followService.getPendingRequests(username);
            return ResponseEntity.ok(pending);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/stats/{userId}")
    public ResponseEntity<?> getFollowStats(
            @PathVariable Long userId,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            FollowStatsResponse stats = followService.getFollowStats(userId, username);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
