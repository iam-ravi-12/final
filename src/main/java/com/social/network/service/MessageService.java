package com.social.network.service;

import com.social.network.dto.ConversationResponse;
import com.social.network.dto.MessageRequest;
import com.social.network.dto.MessageResponse;
import com.social.network.entity.Message;
import com.social.network.entity.User;
import com.social.network.repository.MessageRepository;
import com.social.network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public MessageResponse sendMessage(String senderUsername, MessageRequest request) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Sender not found"));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new UsernameNotFoundException("Receiver not found"));

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(request.getContent());
        message.setIsRead(false);

        Message savedMessage = messageRepository.save(message);
        return mapToMessageResponse(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesBetweenUsers(String currentUsername, Long otherUserId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Current user not found"));

        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new UsernameNotFoundException("Other user not found"));

        List<Message> messages = messageRepository.findMessagesBetweenUsers(currentUser, otherUser);
        return messages.stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(String currentUsername, Long senderId) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Current user not found"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new UsernameNotFoundException("Sender not found"));

        List<Message> unreadMessages = messageRepository.findMessagesBetweenUsers(currentUser, sender).stream()
                .filter(m -> m.getReceiver().getId().equals(currentUser.getId()) && !m.getIsRead())
                .peek(m -> m.setIsRead(true))
                .collect(Collectors.toList());
        
        if (!unreadMessages.isEmpty()) {
            messageRepository.saveAll(unreadMessages);
        }
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<User> conversationPartners = messageRepository.findConversationPartners(currentUser.getId());
        List<ConversationResponse> conversations = new ArrayList<>();

        for (User partner : conversationPartners) {
            List<Message> messages = messageRepository.findMessagesBetweenUsers(currentUser, partner);
            
            if (!messages.isEmpty()) {
                Message lastMessage = messages.get(messages.size() - 1);
                Long unreadCount = messageRepository.countBySenderAndReceiverAndIsRead(
                        partner, currentUser, false);

                ConversationResponse conversation = new ConversationResponse();
                conversation.setUserId(partner.getId());
                conversation.setUsername(partner.getUsername());
                conversation.setProfession(partner.getProfession());
                conversation.setLastMessage(lastMessage.getContent());
                conversation.setLastMessageTime(lastMessage.getCreatedAt());
                conversation.setUnreadCount(unreadCount);

                conversations.add(conversation);
            }
        }

        // Sort by last message time, most recent first
        conversations.sort((c1, c2) -> c2.getLastMessageTime().compareTo(c1.getLastMessageTime()));

        return conversations;
    }

    private MessageResponse mapToMessageResponse(Message message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setSenderId(message.getSender().getId());
        response.setSenderUsername(message.getSender().getUsername());
        response.setReceiverId(message.getReceiver().getId());
        response.setReceiverUsername(message.getReceiver().getUsername());
        response.setContent(message.getContent());
        response.setIsRead(message.getIsRead());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}
