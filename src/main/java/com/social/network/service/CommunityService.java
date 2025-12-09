package com.social.network.service;

import com.social.network.dto.CommunityPostRequest;
import com.social.network.dto.CommunityPostResponse;
import com.social.network.dto.CommunityRequest;
import com.social.network.dto.CommunityResponse;
import com.social.network.entity.Community;
import com.social.network.entity.CommunityMember;
import com.social.network.entity.CommunityPost;
import com.social.network.entity.User;
import com.social.network.repository.CommunityMemberRepository;
import com.social.network.repository.CommunityPostRepository;
import com.social.network.repository.CommunityRepository;
import com.social.network.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final CommunityPostRepository communityPostRepository;
    private final UserRepository userRepository;

    public CommunityService(CommunityRepository communityRepository,
                          CommunityMemberRepository communityMemberRepository,
                          CommunityPostRepository communityPostRepository,
                          UserRepository userRepository) {
        this.communityRepository = communityRepository;
        this.communityMemberRepository = communityMemberRepository;
        this.communityPostRepository = communityPostRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommunityResponse createCommunity(String username, CommunityRequest request) {
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Community community = new Community();
        community.setName(request.getName());
        community.setDescription(request.getDescription());
        community.setIsPrivate(request.getIsPrivate() != null ? request.getIsPrivate() : false);
        community.setProfilePicture(request.getProfilePicture());
        community.setAdmin(admin);

        community = communityRepository.save(community);

        // Auto-add admin as member
        CommunityMember adminMember = new CommunityMember();
        adminMember.setCommunity(community);
        adminMember.setUser(admin);
        communityMemberRepository.save(adminMember);

        return toCommunityResponse(community, admin.getId());
    }

    public List<CommunityResponse> getAllPublicCommunities(Long userId) {
        List<Community> communities = communityRepository.findAllPublicCommunities();
        return communities.stream()
                .map(c -> toCommunityResponse(c, userId))
                .collect(Collectors.toList());
    }

    public List<CommunityResponse> getUserCommunities(Long userId) {
        List<CommunityMember> memberships = communityMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(m -> toCommunityResponse(m.getCommunity(), userId))
                .collect(Collectors.toList());
    }

    public CommunityResponse getCommunityById(Long communityId, Long userId) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));
        return toCommunityResponse(community, userId);
    }

    @Transactional
    public void joinCommunity(Long communityId, Long userId) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (community.getIsPrivate()) {
            throw new RuntimeException("Cannot join private community without invitation");
        }

        // Check if already a member
        if (communityMemberRepository.findByCommunityIdAndUserId(communityId, userId).isPresent()) {
            throw new RuntimeException("Already a member of this community");
        }

        CommunityMember member = new CommunityMember();
        member.setCommunity(community);
        member.setUser(user);
        communityMemberRepository.save(member);
    }

    @Transactional
    public void leaveCommunity(Long communityId, Long userId) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        if (community.getAdmin().getId().equals(userId)) {
            throw new RuntimeException("Admin cannot leave the community");
        }

        CommunityMember member = communityMemberRepository.findByCommunityIdAndUserId(communityId, userId)
                .orElseThrow(() -> new RuntimeException("Not a member of this community"));

        communityMemberRepository.delete(member);
    }

    @Transactional
    public CommunityPostResponse createPost(Long communityId, String username, CommunityPostRequest request) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is a member
        if (communityMemberRepository.findByCommunityIdAndUserId(communityId, user.getId()).isEmpty()) {
            throw new RuntimeException("Must be a member to post in this community");
        }

        CommunityPost post = new CommunityPost();
        post.setCommunity(community);
        post.setUser(user);
        post.setContent(request.getContent());
        post.setMediaUrls(request.getMediaUrls());
        post.setIsApproved(false); // Requires admin approval

        post = communityPostRepository.save(post);

        return toCommunityPostResponse(post);
    }

    public List<CommunityPostResponse> getCommunityPosts(Long communityId, Long userId) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        // Check if user is a member (for private communities)
        if (community.getIsPrivate()) {
            if (communityMemberRepository.findByCommunityIdAndUserId(communityId, userId).isEmpty()) {
                throw new RuntimeException("Must be a member to view posts");
            }
        }

        List<CommunityPost> posts = communityPostRepository.findApprovedPostsByCommunityId(communityId);
        return posts.stream()
                .map(this::toCommunityPostResponse)
                .collect(Collectors.toList());
    }

    public List<CommunityPostResponse> getPendingPosts(Long communityId, Long userId) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new RuntimeException("Community not found"));

        // Only admin can view pending posts
        if (!community.getAdmin().getId().equals(userId)) {
            throw new RuntimeException("Only admin can view pending posts");
        }

        List<CommunityPost> posts = communityPostRepository.findPendingPostsByCommunityId(communityId);
        return posts.stream()
                .map(this::toCommunityPostResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approvePost(Long postId, Long userId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Community community = post.getCommunity();

        // Only admin can approve posts
        if (!community.getAdmin().getId().equals(userId)) {
            throw new RuntimeException("Only admin can approve posts");
        }

        post.setIsApproved(true);
        communityPostRepository.save(post);
    }

    @Transactional
    public void rejectPost(Long postId, Long userId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Community community = post.getCommunity();

        // Only admin can reject posts
        if (!community.getAdmin().getId().equals(userId)) {
            throw new RuntimeException("Only admin can reject posts");
        }

        communityPostRepository.delete(post);
    }

    private CommunityResponse toCommunityResponse(Community community, Long userId) {
        long memberCount = communityMemberRepository.countByCommunityId(community.getId());
        boolean isMember = communityMemberRepository.findByCommunityIdAndUserId(community.getId(), userId).isPresent();
        boolean isAdmin = community.getAdmin().getId().equals(userId);

        return new CommunityResponse(
                community.getId(),
                community.getName(),
                community.getDescription(),
                community.getIsPrivate(),
                community.getProfilePicture(),
                community.getAdmin().getId(),
                community.getAdmin().getUsername(),
                memberCount,
                isMember,
                isAdmin,
                community.getCreatedAt()
        );
    }

    private CommunityPostResponse toCommunityPostResponse(CommunityPost post) {
        return new CommunityPostResponse(
                post.getId(),
                post.getContent(),
                post.getMediaUrls(),
                post.getCommunity().getId(),
                post.getCommunity().getName(),
                post.getUser().getId(),
                post.getUser().getUsername(),
                post.getUser().getProfilePicture(),
                post.getIsApproved(),
                post.getCreatedAt()
        );
    }
}
