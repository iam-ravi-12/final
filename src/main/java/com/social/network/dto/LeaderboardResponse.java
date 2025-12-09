package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardResponse {
    private Long userId;
    private String username;
    private String name;
    private String profession;
    private String profilePicture;
    private Integer leaderboardPoints;
    private Integer rank;
    private String badge; // GOLD, SILVER, BRONZE, or null
}
