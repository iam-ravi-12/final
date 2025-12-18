# Email OTP Verification Feature

This document describes the email OTP (One-Time Password) verification feature implemented for the signup flow.

## Overview

The email OTP verification feature adds an additional security layer to the user registration process by requiring users to verify their email address before completing their profile setup.

## User Flow

1. **Signup**: User fills out the signup form with username, name, email, and password
2. **OTP Generation**: Backend automatically generates a 6-digit OTP and sends it via email
3. **OTP Verification**: User is redirected to OTP verification screen to enter the code
4. **Email Verified**: Upon successful verification, user proceeds to profile setup
5. **Profile Completion**: User completes their professional profile
6. **Full Access**: User gains full access to the application

## Technical Implementation

### Backend (Spring Boot - Java)

#### New Components

1. **EmailOTP Entity** (`src/main/java/com/social/network/entity/EmailOTP.java`)
   - Stores OTP codes with email, expiration timestamp, and verification status
   - OTPs expire after 10 minutes

2. **EmailService** (`src/main/java/com/social/network/service/EmailService.java`)
   - Handles sending OTP emails using Spring Mail
   - Configurable sender email address

3. **OTPService** (`src/main/java/com/social/network/service/OTPService.java`)
   - Generates secure 6-digit OTP codes
   - Validates OTP codes with expiration checking
   - Manages OTP lifecycle (creation, verification, cleanup)

4. **API Endpoints**
   - `POST /api/auth/send-otp` - Resends OTP to email
   - `POST /api/auth/verify-otp` - Verifies OTP code

#### Database Changes

Run the migration script `EMAIL_OTP_MIGRATION.sql`:

```sql
-- Add email_verified column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Create email_otp table
CREATE TABLE IF NOT EXISTS email_otp (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_email_otp (email, otp),
    INDEX idx_verified (verified)
);
```

#### Configuration

Add mail configuration to `application.properties` (optional):

```properties
# Email Configuration (Optional - for OTP verification)
# Uncomment and configure these properties to enable email OTP sending
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

**Important**: 
- Email configuration is **optional** for development/testing
- If email is not configured, OTPs will be printed to the console for testing
- For production, configure SMTP settings to enable actual email delivery
- For Gmail, use [App Passwords](https://support.google.com/accounts/answer/185833) instead of regular password

### Frontend Web (React)

#### New Components

1. **OTPVerification.js** (`frontend/src/pages/OTPVerification.js`)
   - 6-digit OTP input with auto-focus
   - Resend functionality with 60-second countdown
   - Error handling and validation

#### Routing

Added `/verify-otp` route to `App.js`:
```javascript
<Route path="/verify-otp" element={
  <PrivateRoute>
    <OTPVerification />
  </PrivateRoute>
} />
```

### Friend App (React Native)

#### New Components

1. **OTPVerificationScreen.tsx** (`friend/screens/OTPVerificationScreen.tsx`)
   - Mobile-optimized 6-digit OTP input
   - Resend functionality with countdown
   - Platform-specific keyboard handling

#### Navigation

Updated `_layout.tsx` to enforce OTP verification flow:
- Users are redirected to OTP verification if email not verified
- After verification, users proceed to profile setup
- Full app access granted only after profile completion

## Security Features

1. **User Enumeration Prevention**: The `send-otp` endpoint doesn't reveal whether an email exists in the system
2. **OTP Expiration**: OTPs automatically expire after 10 minutes
3. **Secure Generation**: Uses `SecureRandom` for generating OTP codes
4. **Rate Limiting**: 60-second cooldown between resend attempts (client-side)
5. **Single Use**: OTPs are marked as verified and cannot be reused
6. **Error Message Sanitization**: Generic error messages prevent information leakage

## Testing

### Manual Testing Steps

1. **Signup Flow**:
   - Go to signup page
   - Fill in all required fields
   - Submit form
   - Verify OTP email is received
   - Enter OTP on verification screen
   - Verify redirect to profile setup

2. **Resend OTP**:
   - Wait for countdown to finish
   - Click "Resend Code"
   - Verify new OTP email is received
   - Verify old OTP no longer works

3. **OTP Expiration**:
   - Request OTP
   - Wait 10+ minutes
   - Try to verify with expired OTP
   - Verify error message is shown

4. **Invalid OTP**:
   - Enter incorrect 6-digit code
   - Verify error message is shown
   - Verify user can retry

### Email Service Testing

**Without Email Configuration (Development/Testing)**:
- OTP is printed to console in a clear format:
  ```
  =================================================
  EMAIL SERVICE NOT CONFIGURED - OTP for testing:
  Email: user@example.com
  OTP: 123456
  Expires at: 2025-12-18T16:30:00
  =================================================
  ```
- OTP is still stored in database and can be verified normally
- Use the printed OTP to test the verification flow
- This allows development and testing without SMTP configuration

**With Email Configuration (Production)**:
- OTP is sent via email using configured SMTP server
- Check spam folder if email is not received
- Backend logs any email sending errors

## Configuration Requirements

### Backend
- **Email configuration is OPTIONAL** - application will start without it
- If not configured, OTPs are printed to console for testing
- For production, configure SMTP settings in `application.properties`
- For Gmail, use App Passwords (not regular password)
- For other providers, adjust host, port, and TLS settings

### Frontend Web
- Ensure API base URL is correctly configured
- No additional configuration needed

### Friend App
- Ensure API base URL is correctly configured in `.env`
- No additional configuration needed

## Troubleshooting

### Application Won't Start

**Error**: `Parameter 0 of constructor in com.social.network.service.EmailService required a bean of type 'org.springframework.mail.javamail.JavaMailSender'`

**Solution**: This error occurs when Spring Boot Mail dependency is present but not configured. The latest version handles this gracefully:
- EmailService is conditional and only loads when `spring.mail.host` is configured
- If email is not configured, OTPs are printed to console
- Application will start successfully without email configuration

### Emails Not Sending

**Error**: `Failed to send OTP email: Authentication failed`

This typically occurs with Gmail when using a regular password. Follow these steps:

#### For Gmail with 2-Step Verification (Recommended):
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords** (at the bottom of 2-Step Verification page)
4. Click **App passwords**
5. Select **Mail** for app and **Other** for device
6. Enter a name (e.g., "Social Network OTP")
7. Click **Generate**
8. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
9. Use this App Password in `spring.mail.password` (remove spaces)

**Example configuration:**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=abcdabcdabcdabcd  # 16-char App Password, no spaces
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

#### For Gmail WITHOUT 2-Step Verification (Not Recommended):
1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn ON "Less secure app access"
3. Use your regular Gmail password in `spring.mail.password`

**Note**: Google may block this method and requires 2-Step Verification + App Passwords for better security.

#### Other Common Issues:
1. Check SMTP configuration in `application.properties`
2. Verify email credentials are correct
3. Check firewall/network settings for SMTP port access (port 587)
4. Ensure no typos in email/password (spaces, special characters)
5. Check backend console logs for detailed error messages

### OTP Not Working

1. Verify database migration has been run
2. Check that OTP hasn't expired (10-minute window)
3. Ensure email matches the one used during signup
4. Check backend logs for any errors

### Navigation Issues

1. Verify user's `emailVerified` status in database
2. Check navigation logic in `_layout.tsx` (Friend App) or routing in `App.js` (Web)
3. Clear local storage/AsyncStorage and retry

## Future Enhancements

Potential improvements for this feature:

1. **SMS OTP**: Add SMS as an alternative verification method
2. **Rate Limiting**: Backend rate limiting to prevent spam
3. **Email Templates**: HTML email templates with branding
4. **Multi-language Support**: Localized email content
5. **Admin Dashboard**: View and manage OTP requests
6. **Analytics**: Track verification success rates
7. **Backup Codes**: Provide backup verification codes

## Support

For issues or questions about this feature:
1. Check the troubleshooting section above
2. Review backend logs for detailed error messages
3. Verify all configuration steps have been completed
4. Contact the development team with specific error messages
