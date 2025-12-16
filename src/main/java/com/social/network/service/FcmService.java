package com.social.network.service;

import com.google.firebase.messaging.*;
import com.social.network.entity.User;
import com.social.network.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FcmService {

    private static final Logger logger = LoggerFactory.getLogger(FcmService.class);
    private final UserRepository userRepository;

    public FcmService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Send push notification to a single user
     */
    public void sendNotificationToUser(User user, String title, String body, Map<String, String> data) {
        if (user.getFcmToken() == null || user.getFcmToken().isEmpty()) {
            logger.warn("User {} has no FCM token registered", user.getUsername());
            return;
        }

        try {
            Message message = Message.builder()
                    .setToken(user.getFcmToken())
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data != null ? data : new HashMap<>())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setChannelId("sos-alerts")
                                    .setSound("default")
                                    .setPriority(AndroidNotification.Priority.MAX)
                                    .setVisibility(AndroidNotification.Visibility.PUBLIC)
                                    .setColor("#FF0000")
                                    .build())
                            .build())
                    .setApnsConfig(ApnsConfig.builder()
                            .setAps(Aps.builder()
                                    .setSound("default")
                                    .setBadge(1)
                                    .setContentAvailable(true)
                                    .build())
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("Successfully sent notification to user {}: {}", user.getUsername(), response);
        } catch (FirebaseMessagingException e) {
            logger.error("Failed to send notification to user {}: {}", user.getUsername(), e.getMessage());
            
            // If token is invalid, clear it from user record
            if (e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT ||
                e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                logger.info("Clearing invalid FCM token for user {}", user.getUsername());
                user.setFcmToken(null);
                userRepository.save(user);
            }
        }
    }

    /**
     * Send push notification to multiple users
     */
    public void sendNotificationToUsers(List<User> users, String title, String body, Map<String, String> data) {
        for (User user : users) {
            sendNotificationToUser(user, title, body, data);
        }
    }

    /**
     * Send SOS alert notification
     */
    public void sendSosAlertNotification(User user, String alertUsername, String emergencyType, Double distance) {
        Map<String, String> emergencyLabels = Map.of(
                "IMMEDIATE_EMERGENCY", "🚨 Emergency",
                "ACCIDENT", "🚑 Accident",
                "WOMEN_SAFETY", "👩 Women Safety",
                "MEDICAL", "⚕️ Medical",
                "FIRE", "🔥 Fire"
        );

        String title = emergencyLabels.getOrDefault(emergencyType, "🚨 SOS Alert");
        
        String distanceText = "location nearby";
        if (distance != null) {
            if (distance < 1) {
                int meters = (int) Math.round(distance * 1000);
                distanceText = meters + " meter" + (meters == 1 ? "" : "s") + " away";
            } else {
                distanceText = String.format("%.1f km away", distance);
            }
        }

        String body = alertUsername + " needs help - " + distanceText;

        Map<String, String> data = new HashMap<>();
        data.put("type", "sos-alert");
        data.put("username", alertUsername);
        data.put("emergencyType", emergencyType);
        if (distance != null) {
            data.put("distance", distance.toString());
        }

        sendNotificationToUser(user, title, body, data);
    }
}
