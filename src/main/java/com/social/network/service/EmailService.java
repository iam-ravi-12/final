package com.social.network.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "spring.mail.host")
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@socialnetwork.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendOTPEmail(String toEmail, String otp) {
        int maxRetries = 3;
        int retryDelay = 1000; // 1 second initial delay
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("Email Verification - Your OTP Code");
                message.setText(buildOTPEmailContent(otp));
                
                mailSender.send(message);
                System.out.println("OTP email sent successfully to: " + toEmail + " (attempt " + attempt + ")");
                return; // Success - exit the method
            } catch (Exception e) {
                System.err.println("Failed to send OTP email (attempt " + attempt + "/" + maxRetries + "): " + e.getMessage());
                
                if (attempt == maxRetries) {
                    // Log final failure but don't throw exception as this is async
                    System.err.println("All attempts to send OTP email failed for: " + toEmail);
                    System.err.println("Error details: " + e.getClass().getName() + " - " + e.getMessage());
                } else {
                    // Wait before retry with exponential backoff
                    try {
                        Thread.sleep(retryDelay * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
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
