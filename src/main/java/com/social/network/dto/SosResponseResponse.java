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
    private Boolean confirmedByAlertOwner;
    private String status;
    private String alertOwnerUsername;
    private String alertOwnerEmail;
    private String responderEmail;
    private Double alertLatitude;
    private Double alertLongitude;
    private String alertEmergencyType;
    private String alertDescription;
    private String alertLocationAddress;
    private LocalDateTime createdAt;
}
