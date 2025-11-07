package com.social.network.controller;

import com.social.network.dto.ConversationResponse;
import com.social.network.dto.MessageRequest;
import com.social.network.dto.MessageResponse;
import com.social.network.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @Valid @RequestBody MessageRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        MessageResponse response = messageService.sendMessage(username, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(Authentication authentication) {
        String username = authentication.getName();
        List<ConversationResponse> conversations = messageService.getConversations(username);
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/with/{userId}")
    public ResponseEntity<List<MessageResponse>> getMessagesWithUser(
            @PathVariable Long userId,
            Authentication authentication) {
        String username = authentication.getName();
        List<MessageResponse> messages = messageService.getMessagesBetweenUsers(username, userId);
        return ResponseEntity.ok(messages);
    }

    @PutMapping("/read/{userId}")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long userId,
            Authentication authentication) {
        String username = authentication.getName();
        messageService.markMessagesAsRead(username, userId);
        return ResponseEntity.ok().build();
    }
}
