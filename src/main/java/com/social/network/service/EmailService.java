package com.social.network.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username:noreply@socialnetwork.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOTPEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Email Verification - Your OTP Code");
            message.setText(buildOTPEmailContent(otp));
            
            mailSender.send(message);
        } catch (Exception e) {
            // Log the detailed error for debugging but throw a generic message
            System.err.println("Failed to send OTP email: " + e.getMessage());
            throw new RuntimeException("Failed to send verification email. Please try again later.");
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
