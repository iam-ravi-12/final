package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowResponse {
    private Long id;
    private Long userId;
    private String username;
    private String name;
    private String profession;
    private String profilePicture;
    private Boolean isAccepted;
    private LocalDateTime createdAt;
}
