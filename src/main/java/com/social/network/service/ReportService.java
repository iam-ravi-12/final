package com.social.network.service;

import com.social.network.dto.ReportRequest;
import com.social.network.dto.ReportResponse;
import com.social.network.entity.*;
import com.social.network.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommunityRepository communityRepository;
    private final CommunityPostRepository communityPostRepository;

    public ReportService(ReportRepository reportRepository,
                         UserRepository userRepository,
                         PostRepository postRepository,
                         CommunityRepository communityRepository,
                         CommunityPostRepository communityPostRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.communityRepository = communityRepository;
        this.communityPostRepository = communityPostRepository;
    }

    public ReportResponse submitReport(String username, ReportRequest request) {
        User reporter = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate that at least one target is specified
        if (request.getReportedPostId() == null &&
            request.getReportedUserId() == null &&
            request.getReportedCommunityId() == null &&
            request.getReportedCommunityPostId() == null) {
            throw new IllegalArgumentException("At least one report target must be specified");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setReason(request.getReason());
        report.setStatus(ReportStatus.PENDING);

        // Handle post report
        if (request.getReportedPostId() != null) {
            Post post = postRepository.findById(request.getReportedPostId())
                    .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + request.getReportedPostId()));

            if (post.getUser().getId().equals(reporter.getId())) {
                throw new IllegalArgumentException("You cannot report your own post");
            }

            if (reportRepository.existsByReporterAndReportedPost(reporter, post)) {
                throw new IllegalStateException("You have already reported this post");
            }

            report.setReportedPost(post);
            report.setReportedUser(post.getUser());
        }

        // Handle user report
        if (request.getReportedUserId() != null) {
            User reportedUser = userRepository.findById(request.getReportedUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + request.getReportedUserId()));

            if (reportedUser.getId().equals(reporter.getId())) {
                throw new IllegalArgumentException("You cannot report yourself");
            }

            if (reportRepository.existsByReporterAndReportedUser(reporter, reportedUser)) {
                throw new IllegalStateException("You have already reported this user");
            }

            report.setReportedUser(reportedUser);
        }

        // Handle community report
        if (request.getReportedCommunityId() != null) {
            Community community = communityRepository.findById(request.getReportedCommunityId())
                    .orElseThrow(() -> new IllegalArgumentException("Community not found with ID: " + request.getReportedCommunityId()));

            if (reportRepository.existsByReporterAndReportedCommunity(reporter, community)) {
                throw new IllegalStateException("You have already reported this community");
            }

            report.setReportedCommunity(community);
        }

        // Handle community post report
        if (request.getReportedCommunityPostId() != null) {
            CommunityPost communityPost = communityPostRepository.findById(request.getReportedCommunityPostId())
                    .orElseThrow(() -> new IllegalArgumentException("Community post not found with ID: " + request.getReportedCommunityPostId()));

            if (communityPost.getUser().getId().equals(reporter.getId())) {
                throw new IllegalArgumentException("You cannot report your own post");
            }

            if (reportRepository.existsByReporterAndReportedCommunityPost(reporter, communityPost)) {
                throw new IllegalStateException("You have already reported this community post");
            }

            report.setReportedCommunityPost(communityPost);
            report.setReportedUser(communityPost.getUser());
        }

        Report savedReport = reportRepository.save(report);

        logger.info("User '{}' submitted report ID: {}, Reason: '{}'", username, savedReport.getId(), request.getReason());

        return mapToResponse(savedReport);
    }

    private ReportResponse mapToResponse(Report r) {
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
}
