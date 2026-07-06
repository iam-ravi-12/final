package com.social.network.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${sendgrid.api.key:}")
    private String apiKey;

    @Value("${sendgrid.from.email:noreply@yourdomain.com}")
    private String fromEmail;

    @Value("${sendgrid.from.name:Friends Social Network}")
    private String fromName;

    @Async
    public void sendOTPEmail(String toEmail, String otp) {
        logger.info("=================================================");
        logger.info("  EMAIL VERIFICATION OTP FOR {}: [{}]", toEmail, otp);
        logger.info("=================================================");

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("xxxxxxxx") || apiKey.contains("YOUR_SENDGRID")) {
            logger.warn("SendGrid API key not configured or contains placeholder. OTP printed above to console.");
            return;
        }

        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);
            String subject = "Friends - Email Verification Code: " + otp;
            Content content = new Content("text/html", buildOTPEmailHtml(otp));

            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(apiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.info("OTP email sent successfully via SendGrid API to {} (status: {})", toEmail, response.getStatusCode());
            } else {
                logger.error("Failed to send OTP email via SendGrid to {}. Status: {}, Body: {}", 
                    toEmail, response.getStatusCode(), response.getBody());
            }
        } catch (IOException e) {
            logger.error("IOException while sending SendGrid OTP email to {}: {}", toEmail, e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error sending SendGrid OTP email to {}: {}", toEmail, e.getMessage(), e);
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
