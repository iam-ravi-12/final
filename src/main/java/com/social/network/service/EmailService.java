package com.social.network.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@ConditionalOnProperty(name = "sendgrid.api.key")
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final SendGrid sendGrid;
    
    @Value("${sendgrid.from.email:noreply@socialnetwork.com}")
    private String fromEmail;
    
    @Value("${sendgrid.from.name:Friends Social Network}")
    private String fromName;

    public EmailService(@Value("${sendgrid.api.key}") String sendGridApiKey) {
        this.sendGrid = new SendGrid(sendGridApiKey);
    }

    public void sendOTPEmail(String toEmail, String otp) {
        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Email Verification - Your OTP Code";
            Content content = new Content("text/plain", buildOTPEmailContent(otp));
            Mail mail = new Mail(from, subject, to, content);

            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            
            Response response = sendGrid.api(request);
            
            // SendGrid returns 202 for successful acceptance
            if (response.getStatusCode() < 200 || response.getStatusCode() >= 300) {
                logger.error("Failed to send OTP email. Status: {}, Response: {}", 
                    response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to send verification email. Please try again later.");
            }
            
            logger.info("OTP email sent successfully to {}", toEmail);
        } catch (IOException e) {
            // Log the detailed error for debugging but throw a generic message
            logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage(), e);
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
