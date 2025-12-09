package com.social.network.repository;

import com.social.network.entity.CommunityMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Long> {
    
    @Query("SELECT cm FROM CommunityMember cm WHERE cm.community.id = :communityId AND cm.user.id = :userId")
    Optional<CommunityMember> findByCommunityIdAndUserId(Long communityId, Long userId);
    
    @Query("SELECT cm FROM CommunityMember cm WHERE cm.user.id = :userId")
    List<CommunityMember> findByUserId(Long userId);
    
    @Query("SELECT cm FROM CommunityMember cm WHERE cm.community.id = :communityId")
    List<CommunityMember> findByCommunityId(Long communityId);
    
    @Query("SELECT COUNT(cm) FROM CommunityMember cm WHERE cm.community.id = :communityId")
    long countByCommunityId(Long communityId);
}
