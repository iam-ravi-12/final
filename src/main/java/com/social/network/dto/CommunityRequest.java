package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommunityRequest {
    private String name;
    private String description;
    private Boolean isPrivate;
    private String profilePicture;
}
