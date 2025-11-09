package com.social.network.repository;

import com.social.network.entity.Follow;
import com.social.network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {
    
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);
    
    @Query("SELECT f FROM Follow f WHERE f.following.id = :userId AND f.isAccepted = true")
    List<Follow> findAcceptedFollowersByUserId(Long userId);
    
    @Query("SELECT f FROM Follow f WHERE f.follower.id = :userId AND f.isAccepted = true")
    List<Follow> findAcceptedFollowingsByUserId(Long userId);
    
    @Query("SELECT f FROM Follow f WHERE f.following.id = :userId AND f.isAccepted = false")
    List<Follow> findPendingRequestsByUserId(Long userId);
    
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.following.id = :userId AND f.isAccepted = true")
    long countFollowersByUserId(Long userId);
    
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.follower.id = :userId AND f.isAccepted = true")
    long countFollowingByUserId(Long userId);
    
    boolean existsByFollowerAndFollowing(User follower, User following);
}
