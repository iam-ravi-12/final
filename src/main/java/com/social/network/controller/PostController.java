package com.social.network.controller;

import com.social.network.dto.CommentRequest;
import com.social.network.dto.CommentResponse;
import com.social.network.dto.PostRequest;
import com.social.network.dto.PostResponse;
import com.social.network.service.CommentService;
import com.social.network.service.PostService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PostController {

    private final PostService postService;
    private final CommentService commentService;

    public PostController(PostService postService, CommentService commentService) {
        this.postService = postService;
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<?> createPost(
            Authentication authentication,
            @Valid @RequestBody PostRequest postRequest) {
        try {
            String username = authentication.getName();
            PostResponse response = postService.createPost(username, postRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<PostResponse>> getAllPosts(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            List<PostResponse> posts = postService.getAllPostsForUser(username);
            return ResponseEntity.ok(posts);
        } else {
            List<PostResponse> posts = postService.getAllPosts();
            return ResponseEntity.ok(posts);
        }
    }

    @GetMapping("/profession")
    public ResponseEntity<?> getPostsByProfession(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<PostResponse> posts = postService.getPostsByProfession(username);
            return ResponseEntity.ok(posts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/help")
    public ResponseEntity<List<PostResponse>> getHelpPosts(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            List<PostResponse> posts = postService.getHelpPostsForUser(username);
            return ResponseEntity.ok(posts);
        } else {
            List<PostResponse> posts = postService.getHelpPosts();
            return ResponseEntity.ok(posts);
        }
    }

    @GetMapping("/{postId}")
    public ResponseEntity<?> getPostById(
            @PathVariable Long postId,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            PostResponse post = postService.getPostById(postId, username);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> toggleLike(
            @PathVariable Long postId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            postService.toggleLike(postId, username);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable Long postId,
            Authentication authentication,
            @Valid @RequestBody CommentRequest commentRequest) {
        try {
            String username = authentication.getName();
            CommentResponse response = commentService.createComment(postId, username, commentRequest);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long postId) {
        try {
            List<CommentResponse> comments = commentService.getCommentsByPost(postId);
            return ResponseEntity.ok(comments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

