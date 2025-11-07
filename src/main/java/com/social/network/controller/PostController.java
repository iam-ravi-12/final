package com.social.network.controller;

import com.social.network.dto.PostRequest;
import com.social.network.dto.PostResponse;
import com.social.network.service.PostService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PostController {

    @Autowired
    private PostService postService;

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
    public ResponseEntity<List<PostResponse>> getAllPosts() {
        List<PostResponse> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts);
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
    public ResponseEntity<List<PostResponse>> getHelpPosts() {
        List<PostResponse> posts = postService.getHelpPosts();
        return ResponseEntity.ok(posts);
    }
}
