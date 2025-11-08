package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String profession;
    private String organization;
    private String location;
    private Boolean profileCompleted;
    private String profilePicture;
}
