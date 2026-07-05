package com.social.network.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.from-name:Friends Social Network}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendOTPEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Friends - Email Verification Code: " + otp);
            helper.setText(buildOTPEmailHtml(otp), true); // true = HTML

            mailSender.send(message);
            logger.info("OTP email sent successfully to {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage(), e);
            // Don't throw — we don't want to block account creation if email fails
        }
    }

    private String buildOTPEmailHtml(String otp) {
        return """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto;
                        padding: 32px; background: #f8f9fa; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #0a2d8f; margin: 0; font-size: 28px;">Friends</h1>
                    <p style="color: #6c757d; margin: 4px 0 0;">Social Network</p>
                </div>

                <div style="background: #ffffff; border-radius: 10px; padding: 28px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <h2 style="color: #333; margin: 0 0 12px; font-size: 20px;">
                        Verify Your Email
                    </h2>
                    <p style="color: #555; font-size: 15px; line-height: 1.5; margin: 0 0 20px;">
                        Use the code below to verify your email address. This code is valid for
                        <strong>10 minutes</strong>.
                    </p>

                    <div style="background: #0a2d8f; color: #ffffff; text-align: center;
                                padding: 16px; border-radius: 8px; font-size: 32px;
                                letter-spacing: 8px; font-weight: bold;">
                        %s
                    </div>

                    <p style="color: #999; font-size: 13px; margin: 20px 0 0; text-align: center;">
                        If you didn't request this code, you can safely ignore this email.
                    </p>
                </div>

                <p style="color: #aaa; font-size: 12px; text-align: center; margin: 16px 0 0;">
                    &copy; Friends Social Network
                </p>
            </div>
            """.formatted(otp);
    }
}
