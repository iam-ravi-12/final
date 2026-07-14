package com.social.network.repository;

import com.social.network.entity.User;
import com.social.network.entity.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    List<User> findByOrderByLeaderboardPointsDesc(Pageable pageable);
    List<User> findByFcmTokenIsNotNull();

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:profession IS NULL OR u.profession = :profession) AND " +
           "(:role IS NULL OR u.role = :role)")
    org.springframework.data.domain.Page<User> findAllFiltered(
            @org.springframework.data.repository.query.Param("search") String search,
            @org.springframework.data.repository.query.Param("profession") String profession,
            @org.springframework.data.repository.query.Param("role") Role role,
            Pageable pageable);

    long countByStatus(com.social.network.entity.AccountStatus status);
}
