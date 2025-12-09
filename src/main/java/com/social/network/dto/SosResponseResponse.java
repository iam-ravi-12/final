package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SosResponseResponse {
    private Long id;
    private Long sosAlertId;
    private Long responderId;
    private String responderUsername;
    private String responderProfilePicture;
    private String responseType;
    private String message;
    private Integer pointsAwarded;
    private LocalDateTime createdAt;
}
