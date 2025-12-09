package com.social.network.repository;

import com.social.network.entity.Community;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityRepository extends JpaRepository<Community, Long> {
    
    @Query("SELECT c FROM Community c WHERE c.isPrivate = false")
    List<Community> findAllPublicCommunities();
    
    @Query("SELECT c FROM Community c WHERE c.admin.id = :adminId")
    List<Community> findByAdminId(Long adminId);
}
