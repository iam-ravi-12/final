package com.social.network.service;

import com.social.network.dto.PostRequest;
import com.social.network.dto.PostResponse;
import com.social.network.entity.Post;
import com.social.network.entity.User;
import com.social.network.repository.PostRepository;
import com.social.network.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

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

        return convertToResponse(savedPost);
    }

    public List<PostResponse> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToResponse)
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
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<PostResponse> getHelpPosts() {
        return postRepository.findByIsHelpSectionTrueOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private PostResponse convertToResponse(Post post) {
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setIsHelpSection(post.getIsHelpSection());
        response.setUsername(post.getUser().getUsername());
        response.setUserProfession(post.getUserProfession());
        response.setCreatedAt(post.getCreatedAt());
        return response;
    }
}
