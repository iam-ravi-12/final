package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStats {
    private long totalUsers;
    private long activeUsers;
    private long totalPosts;
    private long totalCommunities;
    private long totalMessages;
    private long totalSosAlerts;
    private long totalReports;
    private long pendingReports;
    private long totalBannedUsers;
}
