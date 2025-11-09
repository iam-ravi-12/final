package com.social.network.repository;

import com.social.network.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    
    @Query("SELECT cp FROM CommunityPost cp WHERE cp.community.id = :communityId AND cp.isApproved = true ORDER BY cp.createdAt DESC")
    List<CommunityPost> findApprovedPostsByCommunityId(Long communityId);
    
    @Query("SELECT cp FROM CommunityPost cp WHERE cp.community.id = :communityId AND cp.isApproved = false ORDER BY cp.createdAt DESC")
    List<CommunityPost> findPendingPostsByCommunityId(Long communityId);
    
    @Query("SELECT cp FROM CommunityPost cp WHERE cp.user.id = :userId ORDER BY cp.createdAt DESC")
    List<CommunityPost> findByUserId(Long userId);
}
