package com.social.network.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@ConditionalOnProperty(name = "sendgrid.api.key")
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;
    
    @Value("${sendgrid.from.email:noreply@socialnetwork.com}")
    private String fromEmail;
    
    @Value("${sendgrid.from.name:Friends Social Network}")
    private String fromName;

    public void sendOTPEmail(String toEmail, String otp) {
        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Email Verification - Your OTP Code";
            Content content = new Content("text/plain", buildOTPEmailContent(otp));
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            
            Response response = sg.api(request);
            
            // SendGrid returns 202 for successful acceptance
            if (response.getStatusCode() < 200 || response.getStatusCode() >= 300) {
                System.err.println("Failed to send OTP email. Status: " + response.getStatusCode());
                System.err.println("Response body: " + response.getBody());
                throw new RuntimeException("Failed to send verification email. Please try again later.");
            }
        } catch (IOException e) {
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
