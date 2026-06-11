package com.social.network.service;

import com.social.network.dto.ConversationResponse;
import com.social.network.dto.MessageRequest;
import com.social.network.dto.MessageResponse;
import com.social.network.entity.Message;
import com.social.network.entity.User;
import com.social.network.repository.MessageRepository;
import com.social.network.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
        MessageResponse response = mapToMessageResponse(savedMessage);

        // Real-time: send the message to the receiver via WebSocket
        try {
            messagingTemplate.convertAndSendToUser(
                    receiver.getUsername(),
                    "/queue/messages",
                    response
            );

            // Also send a conversation update so their chat list refreshes
            ConversationResponse conversationUpdate = buildConversationUpdate(
                    sender, receiver, savedMessage);
            messagingTemplate.convertAndSendToUser(
                    receiver.getUsername(),
                    "/queue/conversations",
                    conversationUpdate
            );

            log.info("WebSocket message sent to user: {}", receiver.getUsername());
        } catch (Exception e) {
            // Don't fail the REST response if WebSocket broadcast fails
            log.warn("Failed to broadcast message via WebSocket: {}", e.getMessage());
        }

        return response;
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
        List<Long> partnerIds = messageRepository.findConversationPartnerIds(currentUser.getId());
        if (partnerIds.isEmpty()) {
            return List.of();
        }

//        List<User> conversationPartners = messageRepository.findConversationPartnerIds(currentUser.getId());
//        List<ConversationResponse> conversations = new ArrayList<>();
        List<User> partners = userRepository.findAllById(partnerIds);
        // map id -> User for quick lookup
        Map<Long, User> partnerMap = partners.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<ConversationResponse> conversations = new ArrayList<>();

//        for (User partner : conversationPartners) {
//            List<Message> messages = messageRepository.findMessagesBetweenUsers(currentUser, partner);
//
//            if (!messages.isEmpty()) {
//                Message lastMessage = messages.get(messages.size() - 1);
//                Long unreadCount = messageRepository.countBySenderAndReceiverAndIsRead(
//                        partner, currentUser, false);
//
//                ConversationResponse conversation = new ConversationResponse();
//                conversation.setUserId(partner.getId());
//                conversation.setUsername(partner.getUsername());
//                conversation.setProfession(partner.getProfession());
//                conversation.setLastMessage(lastMessage.getContent());
//                conversation.setLastMessageTime(lastMessage.getCreatedAt());
//                conversation.setUnreadCount(unreadCount);
//
//                conversations.add(conversation);
//            }
//        }
//
//        // Sort by last message time, most recent first
//        conversations.sort((c1, c2) -> c2.getLastMessageTime().compareTo(c1.getLastMessageTime()));
//
//        return conversations;
        for (Long partnerId : partnerIds) {
            User partner = partnerMap.get(partnerId);
            if (partner == null) {
                // partner might have been deleted — skip
                continue;
            }

            // get messages between currentUser and partner (this still fetches and orders)
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

    private ConversationResponse buildConversationUpdate(User sender, User receiver, Message message) {
        Long unreadCount = messageRepository.countBySenderAndReceiverAndIsRead(
                sender, receiver, false);
        ConversationResponse conv = new ConversationResponse();
        conv.setUserId(sender.getId());
        conv.setUsername(sender.getUsername());
        conv.setProfession(sender.getProfession());
        conv.setLastMessage(message.getContent());
        conv.setLastMessageTime(message.getCreatedAt());
        conv.setUnreadCount(unreadCount);
        return conv;
    }
}
