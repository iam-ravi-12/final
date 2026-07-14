package com.social.network.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Basic unit test to verify EmailService compiles and has correct structure
 */
@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Test
    public void testEmailServiceCanBeInstantiated() {
        // This test just verifies the class structure is correct
        // In real usage, SendGrid API key would be configured
        assertDoesNotThrow(() -> {
            Class<?> emailServiceClass = Class.forName("com.social.network.service.EmailService");
            assertNotNull(emailServiceClass);
            
            // Verify key methods exist
            emailServiceClass.getDeclaredMethod("sendOTPEmail", String.class, String.class);
        });
    }
    
    @Test
    public void testSendGridImportsAreAvailable() {
        // Verify SendGrid classes are on classpath
        assertDoesNotThrow(() -> {
            Class.forName("com.sendgrid.SendGrid");
            Class.forName("com.sendgrid.helpers.mail.Mail");
            Class.forName("com.sendgrid.helpers.mail.objects.Email");
            Class.forName("com.sendgrid.helpers.mail.objects.Content");
        });
    }
}
