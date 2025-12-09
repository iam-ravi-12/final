package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private String content;
    private Boolean isHelpSection;
    private Boolean isSolved;
    private Boolean showInHome;
    private List<String> mediaUrls;
    private Long userId;
    private String username;
    private String userProfession;
    private String userProfilePicture;
    private LocalDateTime createdAt;
    private long likeCount;
    private long commentCount;
    private boolean likedByCurrentUser;
}
