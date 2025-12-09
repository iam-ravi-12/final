package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SosAlertRequest {
    private Double latitude;
    private Double longitude;
    private String locationAddress;
    private String emergencyType; // GENERAL, ACCIDENT, WOMEN_SAFETY, MEDICAL, FIRE
    private String description;
}
