package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private Boolean profileCompleted;

    public AuthResponse(String token, Long id, String username, String email, Boolean profileCompleted) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.profileCompleted = profileCompleted;
    }
}
