package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityResponse {
    private Long id;
    private String name;
    private String description;
    private Boolean isPrivate;
    private String profilePicture;
    private Long adminId;
    private String adminUsername;
    private Long memberCount;
    private Boolean isMember;
    private Boolean isAdmin;
    private LocalDateTime createdAt;
}
