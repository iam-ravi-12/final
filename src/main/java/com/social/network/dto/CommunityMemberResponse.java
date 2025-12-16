package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityMemberResponse {
    private Long id;
    private Long userId;
    private String username;
    private String name;
    private String profilePicture;
    private String profession;
    private LocalDateTime joinedAt;
    private Boolean isAdmin;
}
