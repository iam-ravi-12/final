package com.social.network.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "spring.mail.host")
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@socialnetwork.com}")
    private String fromEmail;
    
    @Value("${email.otp.max-retries:3}")
    private int maxRetries;
    
    @Value("${email.otp.retry-delay-ms:1000}")
    private int retryDelay;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendOTPEmail(String toEmail, String otp) {
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("Email Verification - Your OTP Code");
                message.setText(buildOTPEmailContent(otp));
                
                mailSender.send(message);
                logger.info("OTP email sent successfully to: {} (attempt {})", toEmail, attempt);
                return; // Success - exit the method
            } catch (Exception e) {
                logger.warn("Failed to send OTP email (attempt {}/{}): {}", attempt, maxRetries, e.getMessage());
                
                if (attempt == maxRetries) {
                    // Log final failure but don't throw exception as this is async
                    logger.error("All attempts to send OTP email failed for: {}. Error: {} - {}", 
                                toEmail, e.getClass().getName(), e.getMessage());
                } else {
                    // Wait before retry with exponential backoff
                    try {
                        Thread.sleep(retryDelay * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        logger.warn("Email retry interrupted for: {}", toEmail);
                        return;
                    }
                }
            }
        }
    }

    private String buildOTPEmailContent(String otp) {
        return "Welcome to Friends Social Network!\n\n" +
               "Your email verification code is: " + otp + "\n\n" +
               "This code will expire in 10 minutes.\n\n" +
               "If you didn't request this code, please ignore this email.\n\n" +
               "Best regards,\n" +
               "Friends Social Network Team";
    }
}
