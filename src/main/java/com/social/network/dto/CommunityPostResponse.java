package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityPostResponse {
    private Long id;
    private String content;
    private List<String> mediaUrls;
    private Long communityId;
    private String communityName;
    private Long userId;
    private String username;
    private String userProfilePicture;
    private Boolean isApproved;
    private LocalDateTime createdAt;
}
