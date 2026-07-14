package com.social.network.repository;

import com.social.network.entity.Report;
import com.social.network.entity.ReportStatus;
import com.social.network.entity.User;
import com.social.network.entity.Post;
import com.social.network.entity.Community;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    @Query("SELECT r FROM Report r WHERE :status IS NULL OR r.status = :status")
    Page<Report> findByStatus(@Param("status") ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);

    void deleteByReportedPost(Post post);

    void deleteByReportedCommunity(Community community);

    @Modifying
    @Query("DELETE FROM Report r WHERE r.reporter = :user OR r.reportedUser = :user")
    void deleteReportsByUser(@Param("user") User user);
}
