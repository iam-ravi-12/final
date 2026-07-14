package com.social.network.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BanRequest {
    @NotBlank(message = "Ban reason is required")
    private String reason;
}
