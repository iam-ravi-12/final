package com.social.network.repository;

import com.social.network.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc();
    List<Post> findByUserProfessionOrderByCreatedAtDesc(String profession);
    List<Post> findByIsHelpSectionTrueOrderByCreatedAtDesc();
}
