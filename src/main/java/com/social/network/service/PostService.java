package com.social.network.service;

import com.social.network.dto.PostRequest;
import com.social.network.dto.PostResponse;
import com.social.network.entity.Post;
import com.social.network.entity.User;
import com.social.network.repository.CommentRepository;
import com.social.network.repository.LikeRepository;
import com.social.network.repository.PostRepository;
import com.social.network.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final FirebaseStorageService firebaseStorageService;

    public PostService(PostRepository postRepository, UserRepository userRepository,
                       LikeRepository likeRepository, CommentRepository commentRepository,
                       FirebaseStorageService firebaseStorageService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.firebaseStorageService = firebaseStorageService;
    }

    public PostResponse createPost(String username, PostRequest postRequest) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getProfileCompleted()) {
            throw new RuntimeException("Please complete your profile first");
        }

        Post post = new Post();
        post.setContent(postRequest.getContent());
        post.setIsHelpSection(postRequest.getIsHelpSection());
        post.setShowInHome(postRequest.getShowInHome());
        post.setUser(user);
        post.setUserProfession(user.getProfession());
        
        // Handle media URLs - upload to Firebase Storage
        if (postRequest.getMediaUrls() != null && !postRequest.getMediaUrls().isEmpty()) {
            java.util.List<String> uploadedUrls = new java.util.ArrayList<>();
            
            for (String mediaUrl : postRequest.getMediaUrls()) {
                // Upload each media file to Firebase Storage
                String uploadedUrl = firebaseStorageService.uploadImage(mediaUrl, "posts");
                uploadedUrls.add(uploadedUrl);
            }
            
            // Use a delimiter that won't appear in URLs
            post.setMediaUrls(String.join("|||MEDIA_SEPARATOR|||", uploadedUrls));
        }

        Post savedPost = postRepository.save(post);

        return convertToResponse(savedPost, user);
    }

    public List<PostResponse> getAllPosts() {
        return postRepository.findByShowInHomeTrueOrderByCreatedAtDesc()
                .stream()
                .map(post -> convertToResponse(post, null))
                .collect(Collectors.toList());
    }

    public List<PostResponse> getAllPostsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByShowInHomeTrueOrderByCreatedAtDesc()
                .stream()
                .map(post -> convertToResponse(post, user))
                .collect(Collectors.toList());
    }

    public List<PostResponse> getPostsByProfession(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getProfession() == null || user.getProfession().isEmpty()) {
            throw new RuntimeException("User profession not set");
        }

        return postRepository.findByUserProfessionOrderByCreatedAtDesc(user.getProfession())
                .stream()
                .filter(post -> post.getIsHelpSection() == null || !post.getIsHelpSection()) // Exclude help posts
                .map(post -> convertToResponse(post, user))
                .collect(Collectors.toList());
    }

    public List<PostResponse> getHelpPosts() {
        return postRepository.findByIsHelpSectionTrueOrderByCreatedAtDesc()
                .stream()
                .map(post -> convertToResponse(post, null))
                .collect(Collectors.toList());
    }

    public List<PostResponse> getHelpPostsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByIsHelpSectionTrueOrderByCreatedAtDesc()
                .stream()
                .map(post -> convertToResponse(post, user))
                .collect(Collectors.toList());
    }

    public PostResponse getPostById(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = username != null ? userRepository.findByUsername(username).orElse(null) : null;
        return convertToResponse(post, user);
    }

    public void toggleLike(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        likeRepository.findByPostAndUser(post, user).ifPresentOrElse(
                likeRepository::delete,
                () -> {
                    com.social.network.entity.Like like = new com.social.network.entity.Like();
                    like.setPost(post);
                    like.setUser(user);
                    likeRepository.save(like);
                }
        );
    }

    public List<PostResponse> getPostsByUserId(Long userId, String currentUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User currentUser = currentUsername != null ? userRepository.findByUsername(currentUsername).orElse(null) : null;
        
        return postRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(post -> convertToResponse(post, currentUser))
                .collect(Collectors.toList());
    }

    public void markAsSolved(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only the post author can mark as solved
        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Only post author can mark as solved");
        }

        // Only help section posts can be marked as solved
        if (post.getIsHelpSection() == null || !post.getIsHelpSection()) {
            throw new RuntimeException("Only help request posts can be marked as solved");
        }

        post.setIsSolved(!post.getIsSolved()); // Toggle solved status
        postRepository.save(post);
    }

    public PostResponse updatePost(Long postId, String username, PostRequest postRequest) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only the post author can update
        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only update your own posts");
        }

        post.setContent(postRequest.getContent());
        post.setIsHelpSection(postRequest.getIsHelpSection());
        post.setShowInHome(postRequest.getShowInHome());
        
        // Handle media URLs
        if (postRequest.getMediaUrls() != null && !postRequest.getMediaUrls().isEmpty()) {
            // Delete old media from Firebase Storage if it exists
            if (post.getMediaUrls() != null && !post.getMediaUrls().isEmpty()) {
                String[] oldUrls = post.getMediaUrls().split("\\|\\|\\|MEDIA_SEPARATOR\\|\\|\\|");
                for (String oldUrl : oldUrls) {
                    firebaseStorageService.deleteImage(oldUrl);
                }
            }
            
            // Upload new media to Firebase Storage
            java.util.List<String> uploadedUrls = new java.util.ArrayList<>();
            for (String mediaUrl : postRequest.getMediaUrls()) {
                String uploadedUrl = firebaseStorageService.uploadImage(mediaUrl, "posts");
                uploadedUrls.add(uploadedUrl);
            }
            
            post.setMediaUrls(String.join("|||MEDIA_SEPARATOR|||", uploadedUrls));
        } else {
            // If no new media provided, delete old media
            if (post.getMediaUrls() != null && !post.getMediaUrls().isEmpty()) {
                String[] oldUrls = post.getMediaUrls().split("\\|\\|\\|MEDIA_SEPARATOR\\|\\|\\|");
                for (String oldUrl : oldUrls) {
                    firebaseStorageService.deleteImage(oldUrl);
                }
            }
            post.setMediaUrls(null);
        }

        Post updatedPost = postRepository.save(post);
        return convertToResponse(updatedPost, user);
    }

    public void deletePost(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only the post author can delete
        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own posts");
        }

        // Delete media from Firebase Storage if it exists
        if (post.getMediaUrls() != null && !post.getMediaUrls().isEmpty()) {
            String[] mediaUrls = post.getMediaUrls().split("\\|\\|\\|MEDIA_SEPARATOR\\|\\|\\|");
            for (String mediaUrl : mediaUrls) {
                firebaseStorageService.deleteImage(mediaUrl);
            }
        }

        postRepository.delete(post);
    }

    private PostResponse convertToResponse(Post post, User currentUser) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setIsHelpSection(post.getIsHelpSection());
        response.setIsSolved(post.getIsSolved());
        response.setShowInHome(post.getShowInHome());
        
        // Parse media URLs
        if (post.getMediaUrls() != null && !post.getMediaUrls().isEmpty()) {
            response.setMediaUrls(List.of(post.getMediaUrls().split("\\|\\|\\|MEDIA_SEPARATOR\\|\\|\\|")));
        }
        
        response.setUserId(post.getUser().getId());
        response.setUsername(post.getUser().getUsername());
        response.setUserProfession(post.getUserProfession());
        response.setUserProfilePicture(post.getUser().getProfilePicture());
        response.setCreatedAt(post.getCreatedAt());
        response.setLikeCount(likeRepository.countByPost(post));
        response.setCommentCount(commentRepository.countByPost(post));
        response.setLiked(currentUser != null && likeRepository.existsByPostAndUser(post, currentUser));
        return response;
    }
}

