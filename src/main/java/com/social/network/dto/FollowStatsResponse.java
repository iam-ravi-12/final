package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowStatsResponse {
    private long followerCount;
    private long followingCount;
    private Boolean isFollowing;
    private Boolean hasPendingRequest;
    private Boolean hasRequestedYou;
}
