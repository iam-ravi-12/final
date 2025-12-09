package com.social.network.service;

import com.social.network.dto.FollowResponse;
import com.social.network.dto.FollowStatsResponse;
import com.social.network.entity.Follow;
import com.social.network.entity.User;
import com.social.network.repository.FollowRepository;
import com.social.network.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void sendFollowRequest(String followerUsername, Long followingId) {
        User follower = userRepository.findByUsername(followerUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("User to follow not found"));

        if (follower.getId().equals(following.getId())) {
            throw new RuntimeException("Cannot follow yourself");
        }

        if (followRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new RuntimeException("Follow request already exists");
        }

        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        follow.setIsAccepted(false);
        followRepository.save(follow);
    }

    @Transactional
    public void acceptFollowRequest(Long followId, String username) {
        Follow follow = followRepository.findById(followId)
                .orElseThrow(() -> new RuntimeException("Follow request not found"));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!follow.getFollowing().getId().equals(user.getId())) {
            throw new RuntimeException("You can only accept requests sent to you");
        }

        follow.setIsAccepted(true);
        followRepository.save(follow);
    }

    @Transactional
    public void rejectFollowRequest(Long followId, String username) {
        Follow follow = followRepository.findById(followId)
                .orElseThrow(() -> new RuntimeException("Follow request not found"));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!follow.getFollowing().getId().equals(user.getId())) {
            throw new RuntimeException("You can only reject requests sent to you");
        }

        followRepository.delete(follow);
    }

    @Transactional
    public void unfollow(String followerUsername, Long followingId) {
        User follower = userRepository.findByUsername(followerUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("User to unfollow not found"));

        Follow follow = followRepository.findByFollowerAndFollowing(follower, following)
                .orElseThrow(() -> new RuntimeException("Follow relationship not found"));

        followRepository.delete(follow);
    }

    public List<FollowResponse> getFollowers(Long userId) {
        List<Follow> followers = followRepository.findAcceptedFollowersByUserId(userId);
        return followers.stream()
                .map(f -> toFollowResponse(f, true))
                .collect(Collectors.toList());
    }

    public List<FollowResponse> getFollowing(Long userId) {
        List<Follow> following = followRepository.findAcceptedFollowingsByUserId(userId);
        return following.stream()
                .map(f -> toFollowResponse(f, false))
                .collect(Collectors.toList());
    }

    public List<FollowResponse> getPendingRequests(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Follow> pendingRequests = followRepository.findPendingRequestsByUserId(user.getId());
        return pendingRequests.stream()
                .map(f -> toFollowResponse(f, true))
                .collect(Collectors.toList());
    }

    public FollowStatsResponse getFollowStats(Long userId, String currentUsername) {
        long followerCount = followRepository.countFollowersByUserId(userId);
        long followingCount = followRepository.countFollowingByUserId(userId);
        
        FollowStatsResponse stats = new FollowStatsResponse();
        stats.setFollowerCount(followerCount);
        stats.setFollowingCount(followingCount);
        
        if (currentUsername != null) {
            User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
            if (currentUser != null && !currentUser.getId().equals(userId)) {
                User targetUser = userRepository.findById(userId).orElse(null);
                if (targetUser != null) {
                    Follow follow = followRepository.findByFollowerAndFollowing(currentUser, targetUser).orElse(null);
                    stats.setIsFollowing(follow != null && follow.getIsAccepted());
                    stats.setHasPendingRequest(follow != null && !follow.getIsAccepted());
                    
                    Follow reverseFollow = followRepository.findByFollowerAndFollowing(targetUser, currentUser).orElse(null);
                    stats.setHasRequestedYou(reverseFollow != null && !reverseFollow.getIsAccepted());
                }
            }
        }
        
        return stats;
    }

    private FollowResponse toFollowResponse(Follow follow, boolean isFollower) {
        User user = isFollower ? follow.getFollower() : follow.getFollowing();
        
        FollowResponse response = new FollowResponse();
        response.setId(follow.getId());
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setName(user.getName());
        response.setProfession(user.getProfession());
        response.setProfilePicture(user.getProfilePicture());
        response.setIsAccepted(follow.getIsAccepted());
        response.setCreatedAt(follow.getCreatedAt());
        return response;
    }
}
