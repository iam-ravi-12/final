package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SosAlertResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userProfession;
    private String userProfilePicture;
    private Double latitude;
    private Double longitude;
    private String locationAddress;
    private String emergencyType;
    private String status;
    private String description;
    private Boolean cancelledByUser;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Integer responseCount;
    private Double distance; // Distance in km from current user
}
