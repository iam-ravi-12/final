package com.social.network.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @PostConstruct
    public void initialize() {
        try {
            // Try to load from classpath first (for production)
            InputStream serviceAccount;
            try {
                serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
                logger.info("Loaded Firebase credentials from classpath");
            } catch (IOException e) {
                // If not found in classpath, try file system (for local development)
                try {
                    serviceAccount = new FileInputStream("firebase-service-account.json");
                    logger.info("Loaded Firebase credentials from file system");
                } catch (IOException ex) {
                    logger.warn("Firebase service account file not found. FCM push notifications will be disabled.");
                    logger.warn("To enable FCM, place firebase-service-account.json in src/main/resources/ or project root");
                    return;
                }
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                logger.info("Firebase Admin SDK initialized successfully");
            }
        } catch (Exception e) {
            logger.error("Error initializing Firebase Admin SDK: {}", e.getMessage());
            logger.warn("FCM push notifications will be disabled");
        }
    }
}
