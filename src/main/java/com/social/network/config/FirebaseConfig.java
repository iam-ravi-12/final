package com.social.network.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.*;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @PostConstruct
    public void initialize() {
        try {
            InputStream serviceAccount = null;

            // 1️⃣ TRY ENV VARIABLE (RENDER / PRODUCTION)
            String base64Credentials = System.getenv("FIREBASE_CREDENTIALS_BASE64");
            if (base64Credentials != null && !base64Credentials.isBlank()) {
                byte[] decodedBytes = Base64.getDecoder().decode(base64Credentials);
                serviceAccount = new ByteArrayInputStream(decodedBytes);
                logger.info("Loaded Firebase credentials from environment variable");
            }

            // 2️⃣ FALLBACK: CLASSPATH (LOCAL DEV)
            if (serviceAccount == null) {
                try {
                    serviceAccount = new ClassPathResource("firebase-service-account.json").getInputStream();
                    logger.info("Loaded Firebase credentials from classpath");
                } catch (IOException ignored) {}
            }

            // 3️⃣ FALLBACK: PROJECT ROOT (LOCAL DEV)
            if (serviceAccount == null) {
                try {
                    serviceAccount = new FileInputStream("firebase-service-account.json");
                    logger.info("Loaded Firebase credentials from project root");
                } catch (IOException ignored) {}
            }

            // 4️⃣ FINAL CHECK
            if (serviceAccount == null) {
                logger.warn("Firebase credentials not found. FCM will be disabled.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                logger.info("Firebase Admin SDK initialized successfully");
            }

        } catch (Exception e) {
            logger.error("Error initializing Firebase Admin SDK", e);
        }
    }
}
