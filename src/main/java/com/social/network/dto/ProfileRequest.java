package com.social.network.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileRequest {

    @NotBlank(message = "Profession is required")
    private String profession;

    @NotBlank(message = "Organization is required")
    private String organization;

    private String profilePicture;
}
