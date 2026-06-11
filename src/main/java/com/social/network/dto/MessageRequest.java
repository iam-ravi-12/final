package com.social.network.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    private String content;

    private String mediaUrl;

    private String mediaType;
}
