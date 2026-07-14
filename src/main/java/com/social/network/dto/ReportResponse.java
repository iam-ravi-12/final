package com.social.network.dto;

import com.social.network.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long id;
    
    private Long reporterId;
    private String reporterName;
    
    private Long reportedUserId;
    private String reportedUserName;
    
    private Long reportedPostId;
    private String reportedPostContent;
    
    private Long reportedCommunityId;
    private String reportedCommunityName;
    
    private String reason;
    private ReportStatus status;
    private LocalDateTime createdAt;
}
