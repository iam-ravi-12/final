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

    public PostService(PostRepository postRepository, UserRepository userRepository,
                       LikeRepository likeRepository, CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
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
        post.setUser(user);
        post.setUserProfession(user.getProfession());

        Post savedPost = postRepository.save(post);

        return convertToResponse(savedPost, user);
    }

    public List<PostResponse> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> convertToResponse(post, null))
                .collect(Collectors.toList());
    }

    public List<PostResponse> getAllPostsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findAllByOrderByCreatedAtDesc()
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

    private PostResponse convertToResponse(Post post, User currentUser) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setIsHelpSection(post.getIsHelpSection());
        response.setUserId(post.getUser().getId());
        response.setUsername(post.getUser().getUsername());
        response.setUserProfession(post.getUserProfession());
        response.setUserProfilePicture(post.getUser().getProfilePicture());
        response.setCreatedAt(post.getCreatedAt());
        response.setLikeCount(likeRepository.countByPost(post));
        response.setCommentCount(commentRepository.countByPost(post));
        response.setLikedByCurrentUser(currentUser != null && likeRepository.existsByPostAndUser(post, currentUser));
        return response;
    }
}

