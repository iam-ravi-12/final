package com.social.network.repository;

import com.social.network.entity.Like;
import com.social.network.entity.Post;
import com.social.network.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    long countByPost(Post post);
    Optional<Like> findByPostAndUser(Post post, User user);
    boolean existsByPostAndUser(Post post, User user);
}
