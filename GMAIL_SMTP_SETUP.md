# Gmail SMTP Configuration Guide for OTP Email Sending

## Quick Setup (Recommended Method)

### Step 1: Enable 2-Step Verification
1. Visit: https://myaccount.google.com/security
2. Click on **2-Step Verification**
3. Follow the prompts to enable it (if not already enabled)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
   - Or navigate from **Security** → **2-Step Verification** → **App passwords** (at bottom)
2. Under "Select app", choose **Mail**
3. Under "Select device", choose **Other (Custom name)**
4. Enter a name like "Social Network OTP"
5. Click **Generate**
6. Copy the 16-character password shown (e.g., `abcd efgh ijkl mnop`)
7. **Important**: Remove all spaces when using it

### Step 3: Configure application.properties
Edit `/src/main/resources/application.properties`:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=abcdefghijklmnop
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `abcdefghijklmnop` with your 16-character App Password (no spaces!)

### Step 4: Restart Application
- Stop your Spring Boot application
- Start it again
- The EmailService will now load and send actual emails

---

## Troubleshooting

### Error: "Authentication failed"

**Cause**: Using regular password instead of App Password

**Solution**: Generate and use App Password (see Step 2 above)

### Error: "Invalid credentials" or "Username and Password not accepted"

**Causes**:
1. App Password has spaces - remove all spaces
2. Typo in email or password
3. Using wrong Gmail account
4. App Password was revoked

**Solution**: 
- Double-check email address
- Regenerate App Password and use it without spaces
- Ensure you're logged into the correct Google account

### Error: "Connection timeout" or "Could not connect to SMTP host"

**Causes**:
1. Firewall blocking port 587
2. Network/proxy issues
3. Wrong SMTP host or port

**Solution**:
- Check firewall allows outbound connections on port 587
- Try port 465 with SSL: `spring.mail.port=465` and add `spring.mail.properties.mail.smtp.ssl.enable=true`
- Verify network connection

### Error: "Less secure app access"

**Cause**: Google has deprecated "Less secure app access" and requires App Passwords

**Solution**: Enable 2-Step Verification and use App Passwords (recommended method above)

---

## Alternative Method (Not Recommended)

If you cannot use App Passwords, you can enable "Less secure app access":

1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn ON "Less secure app access"
3. Use your regular Gmail password

**⚠️ Warning**: This is less secure and Google may block it. Use App Passwords instead.

---

## Security Best Practices

### 1. Never Commit Credentials to Git

**Bad** ❌:
```properties
spring.mail.password=your-actual-password
```

**Good** ✅:
```properties
spring.mail.password=${MAIL_PASSWORD:}
```

Set environment variable: `export MAIL_PASSWORD=your-app-password`

### 2. Use .gitignore for local configs
Add to `.gitignore`:
```
application-local.properties
application-*.properties
!application.properties
```

### 3. Revoke App Passwords When Not Needed
1. Go to: https://myaccount.google.com/apppasswords
2. Find your app password
3. Click the delete icon
4. Confirm removal

---

## Testing

### Console OTP (No Email Configuration)
If you don't configure email, OTPs are printed to console:
```
=================================================
EMAIL SERVICE NOT CONFIGURED - OTP for testing:
Email: user@example.com
OTP: 123456
Expires at: 2025-12-18T16:30:00
=================================================
```

This is useful for development/testing without email setup.

### With Gmail Configured
1. Sign up with a valid email address
2. Check your Gmail inbox for the OTP email
3. Subject: "Email Verification - Your OTP Code"
4. Enter the 6-digit code in the app
5. OTP expires in 10 minutes

---

## Support

If you continue to have issues:
1. Check backend console logs for detailed error messages
2. Verify your Google account has 2-Step Verification enabled
3. Ensure App Password was generated correctly (16 characters, no spaces)
4. Try generating a new App Password
5. Check that port 587 is not blocked by firewall

For more information, see: `EMAIL_OTP_FEATURE.md`
