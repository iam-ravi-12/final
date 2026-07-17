package com.social.network.service;

import com.social.network.dto.AdminDashboardStats;
import com.social.network.dto.AdminUserResponse;
import com.social.network.dto.ReportResponse;
import com.social.network.entity.*;
import com.social.network.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final MessageRepository messageRepository;
    private final FollowRepository followRepository;
    private final SosAlertRepository sosAlertRepository;
    private final SosResponseRepository sosResponseRepository;
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final CommunityPostRepository communityPostRepository;
    private final ReportRepository reportRepository;
    private final CloudinaryService cloudinaryService;

    public AdminService(UserRepository userRepository,
                        PostRepository postRepository,
                        CommentRepository commentRepository,
                        LikeRepository likeRepository,
                        MessageRepository messageRepository,
                        FollowRepository followRepository,
                        SosAlertRepository sosAlertRepository,
                        SosResponseRepository sosResponseRepository,
                        CommunityRepository communityRepository,
                        CommunityMemberRepository communityMemberRepository,
                        CommunityPostRepository communityPostRepository,
                        ReportRepository reportRepository,
                        CloudinaryService cloudinaryService) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
        this.messageRepository = messageRepository;
        this.followRepository = followRepository;
        this.sosAlertRepository = sosAlertRepository;
        this.sosResponseRepository = sosResponseRepository;
        this.communityRepository = communityRepository;
        this.communityMemberRepository = communityMemberRepository;
        this.communityPostRepository = communityPostRepository;
        this.reportRepository = reportRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public AdminDashboardStats getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(AccountStatus.ACTIVE);
        long totalPosts = postRepository.count();
        long totalCommunities = communityRepository.count();
        long totalMessages = messageRepository.count();
        long totalSosAlerts = sosAlertRepository.count();
        long totalReports = reportRepository.count();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long totalBannedUsers = userRepository.countByStatus(AccountStatus.BANNED);

        return new AdminDashboardStats(
                totalUsers,
                activeUsers,
                totalPosts,
                totalCommunities,
                totalMessages,
                totalSosAlerts,
                totalReports,
                pendingReports,
                totalBannedUsers
        );
    }

    public Page<AdminUserResponse> getUsers(String search, String profession, Role role, Pageable pageable) {
        Page<User> users = userRepository.findAllFiltered(search, profession, role, pageable);
        return users.map(user -> new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProfession(),
                user.getProfilePicture(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        ));
    }

    public void banUser(Long userId, String reason, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot ban an admin user");
        }

        if (user.getStatus() == AccountStatus.BANNED) {
            throw new IllegalStateException("User is already banned");
        }

        user.setStatus(AccountStatus.BANNED);
        user.setBanReason(reason);
        user.setBannedAt(LocalDateTime.now());
        userRepository.save(user);

        logger.info("Admin ID: {}, Action: Admin banned user, Banned User ID: {}, Timestamp: {}", 
                adminId, userId, LocalDateTime.now());
    }

    public void unbanUser(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getStatus() != AccountStatus.BANNED) {
            throw new IllegalStateException("User is not banned");
        }

        user.setStatus(AccountStatus.ACTIVE);
        user.setBanReason(null);
        user.setBannedAt(null);
        userRepository.save(user);

        logger.info("Admin ID: {}, Action: Admin unbanned user, Unbanned User ID: {}, Timestamp: {}", 
                adminId, userId, LocalDateTime.now());
    }

    public void deleteUser(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Cannot delete an admin user");
        }

        // 1. Delete reports where user is reporter or reported user
        reportRepository.deleteReportsByUser(user);

        // 2. Delete follows
        followRepository.deleteFollowsByUser(user);

        // 3. Delete messages
        messageRepository.deleteMessagesByUser(user);

        // 4. Delete community memberships
        communityMemberRepository.deleteByUser(user);

        // 5. Delete community posts made by user
        List<CommunityPost> communityPosts = communityPostRepository.findByUserId(userId);
        for (CommunityPost cp : communityPosts) {
            deleteCommunityPostMedia(cp);
        }
        communityPostRepository.deleteByUser(user);

        // 6. Delete communities created by user
        List<Community> communities = communityRepository.findByAdminId(userId);
        for (Community c : communities) {
            deleteCommunityInternal(c, adminId);
        }

        // 7. Delete SOS alerts & responses
        // Delete responses written by this user
        List<SosResponse> responses = sosResponseRepository.findByResponderOrderByCreatedAtDesc(user);
        sosResponseRepository.deleteAll(responses);

        // Delete responses to alerts created by this user, then delete the alerts
        List<SosAlert> alerts = sosAlertRepository.findByUserAndStatusOrderByCreatedAtDesc(user, "ACTIVE");
        alerts.addAll(sosAlertRepository.findByUserAndStatusOrderByCreatedAtDesc(user, "CANCELLED"));
        alerts.addAll(sosAlertRepository.findByUserAndStatusOrderByCreatedAtDesc(user, "RESOLVED"));
        alerts.addAll(sosAlertRepository.findByUserAndStatusOrderByCreatedAtDesc(user, "EXPIRED"));
        for (SosAlert alert : alerts) {
            List<SosResponse> alertResponses = sosResponseRepository.findBySosAlertOrderByCreatedAtDesc(alert);
            sosResponseRepository.deleteAll(alertResponses);
        }
        sosAlertRepository.deleteAll(alerts);

        // 8. Delete posts created by user (and associated comments, likes, reports, and media)
        List<Post> posts = postRepository.findByUserOrderByCreatedAtDesc(user);
        for (Post post : posts) {
            deletePostInternal(post);
        }

        // 9. Clean up comments and likes made by this user on other posts
        commentRepository.deleteByUser(user);
        likeRepository.deleteByUser(user);

        // 10. Delete the user profile picture
        if (user.getProfilePicture() != null && !user.getProfilePicture().isEmpty()) {
            cloudinaryService.deleteMedia(user.getProfilePicture());
        }

        // 11. Delete the user
        userRepository.delete(user);

        logger.info("Admin ID: {}, Action: Admin deleted user, Deleted User ID: {}, Timestamp: {}", 
                adminId, userId, LocalDateTime.now());
    }

    public void forceDeletePost(Long postId, Long adminId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        deletePostInternal(post);

        logger.info("Admin ID: {}, Action: Admin deleted post, Post ID: {}, Timestamp: {}", 
                adminId, postId, LocalDateTime.now());
    }

    public void deleteCommunity(Long communityId, Long adminId) {
        Community community = communityRepository.findById(communityId)
                .orElseThrow(() -> new IllegalArgumentException("Community not found with ID: " + communityId));

        deleteCommunityInternal(community, adminId);

        logger.info("Admin ID: {}, Action: Admin deleted community, Community ID: {}, Timestamp: {}", 
                adminId, communityId, LocalDateTime.now());
    }

    public void deleteCommunityPost(Long postId, Long adminId) {
        CommunityPost post = communityPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Community post not found with ID: " + postId));

        reportRepository.deleteByReportedCommunityPost(post);
        deleteCommunityPostMedia(post);
        communityPostRepository.delete(post);

        logger.info("Admin ID: {}, Action: Admin deleted community post, Post ID: {}, Timestamp: {}", 
                adminId, postId, LocalDateTime.now());
    }

    public Page<ReportResponse> getReports(ReportStatus status, Pageable pageable) {
        Page<Report> reports = reportRepository.findByStatus(status, pageable);
        return reports.map(this::mapReportToResponse);
    }

    public void resolveReport(Long reportId, String adminNotes, Long adminId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with ID: " + reportId));

        report.setStatus(ReportStatus.RESOLVED);
        if (adminNotes != null && !adminNotes.isBlank()) {
            report.setAdminNotes(adminNotes);
        }
        reportRepository.save(report);

        logger.info("Admin ID: {}, Action: Resolved report, Report ID: {}, Timestamp: {}",
                adminId, reportId, java.time.LocalDateTime.now());
    }

    public void dismissReport(Long reportId, String adminNotes, Long adminId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with ID: " + reportId));

        report.setStatus(ReportStatus.DISMISSED);
        if (adminNotes != null && !adminNotes.isBlank()) {
            report.setAdminNotes(adminNotes);
        }
        reportRepository.save(report);

        logger.info("Admin ID: {}, Action: Dismissed report, Report ID: {}, Timestamp: {}",
                adminId, reportId, java.time.LocalDateTime.now());
    }

    private ReportResponse mapReportToResponse(Report r) {
        return new ReportResponse(
                r.getId(),
                r.getReporter().getId(),
                r.getReporter().getName(),
                r.getReportedUser() != null ? r.getReportedUser().getId() : null,
                r.getReportedUser() != null ? r.getReportedUser().getName() : null,
                r.getReportedPost() != null ? r.getReportedPost().getId() : null,
                r.getReportedPost() != null ? r.getReportedPost().getContent() : null,
                r.getReportedCommunity() != null ? r.getReportedCommunity().getId() : null,
                r.getReportedCommunity() != null ? r.getReportedCommunity().getName() : null,
                r.getReportedCommunityPost() != null ? r.getReportedCommunityPost().getId() : null,
                r.getReportedCommunityPost() != null ? r.getReportedCommunityPost().getContent() : null,
                r.getReason(),
                r.getAdminNotes(),
                r.getStatus(),
                r.getCreatedAt()
        );
    }

    // Helper methods for internal cascades
    private void deletePostInternal(Post post) {
        commentRepository.deleteByPost(post);
        likeRepository.deleteByPost(post);
        reportRepository.deleteByReportedPost(post);

        if (post.getMediaUrls() != null && !post.getMediaUrls().isEmpty()) {
            String[] urls = post.getMediaUrls().split("\\|\\|\\|MEDIA_SEPARATOR\\|\\|\\|");
            for (String url : urls) {
                cloudinaryService.deleteMedia(url);
            }
        }
        postRepository.delete(post);
    }

    private void deleteCommunityInternal(Community community, Long adminId) {
        // Delete reports pointing to this community
        reportRepository.deleteByReportedCommunity(community);

        // Delete community members
        communityMemberRepository.deleteByCommunity(community);

        // Find community posts and delete them
        List<CommunityPost> posts = communityPostRepository.findByCommunityId(community.getId());
        for (CommunityPost post : posts) {
            reportRepository.deleteByReportedCommunityPost(post);
            deleteCommunityPostMedia(post);
        }
        communityPostRepository.deleteByCommunity(community);

        // Delete community profile picture from Cloudinary
        if (community.getProfilePicture() != null && !community.getProfilePicture().isEmpty()) {
            cloudinaryService.deleteMedia(community.getProfilePicture());
        }

        // Delete community itself
        communityRepository.delete(community);
    }

    private void deleteCommunityPostMedia(CommunityPost post) {
        if (post.getMediaUrls() != null && !post.getMediaUrls().isEmpty()) {
            for (String url : post.getMediaUrls()) {
                cloudinaryService.deleteMedia(url);
            }
        }
    }
}
