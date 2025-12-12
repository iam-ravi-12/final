package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SosResponseRequest {
    private Long sosAlertId;
    private String responseType; // ON_WAY, CONTACTED_AUTHORITIES, REACHED, RESOLVED
    private String message;
}
