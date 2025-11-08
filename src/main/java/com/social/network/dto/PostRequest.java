package com.social.network.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private Boolean isHelpSection = false;
    
    private List<String> mediaUrls;
}
