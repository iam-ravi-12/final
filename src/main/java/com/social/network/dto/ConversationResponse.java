package com.social.network.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private Long userId;
    private String username;
    private String profession;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;
}
