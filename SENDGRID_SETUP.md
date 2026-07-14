# SendGrid Configuration Guide for OTP Email Sending

## Overview

This application uses SendGrid to send OTP (One-Time Password) verification emails to users during signup. SendGrid is a cloud-based email delivery service that provides reliable email infrastructure.

## Quick Setup

### Step 1: Create a SendGrid Account

1. Visit: https://signup.sendgrid.com/
2. Sign up for a free account (Free tier includes 100 emails/day)
3. Verify your email address
4. Complete the account setup

### Step 2: Verify Your Sender Identity

SendGrid requires sender verification to prevent spam. Choose one option:

#### Option A: Single Sender Verification (Easiest for Development)
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click **Create New Sender**
3. Fill in the form with your details:
   - From Name: `Friends Social Network` (or your app name)
   - From Email Address: Your verified email (e.g., `noreply@yourdomain.com`)
   - Reply To: Same as from email or your support email
   - Complete other required fields
4. Click **Create**
5. Check your email and click the verification link
6. Once verified, you can use this email address to send emails

#### Option B: Domain Authentication (Recommended for Production)
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Click **Authenticate Your Domain**
3. Choose your DNS host
4. Follow the instructions to add DNS records (CNAME records)
5. Verify the domain
6. Once verified, you can send from any email address at your domain

### Step 3: Create an API Key

1. Go to: https://app.sendgrid.com/settings/api_keys
2. Click **Create API Key**
3. Choose a name (e.g., "Social Network OTP")
4. Select **Restricted Access**
5. Under **Mail Send**, toggle **Mail Send** to **FULL ACCESS**
6. All other permissions can remain off
7. Click **Create & View**
8. **IMPORTANT**: Copy the API key immediately - it will only be shown once!
   - Format: `SG.xxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`

### Step 4: Configure application.properties

Edit `/src/main/resources/application.properties`:

```properties
# SendGrid Email Configuration
sendgrid.api.key=SG.xxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
sendgrid.from.email=noreply@yourdomain.com
sendgrid.from.name=Friends Social Network
```

Replace:
- `SG.xxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy` with your actual API key
- `noreply@yourdomain.com` with your verified sender email address
- `Friends Social Network` with your desired sender name

### Step 5: Restart Application

- Stop your Spring Boot application
- Start it again
- The EmailService will now load and send emails via SendGrid

---

## Testing

### Without SendGrid Configuration (Development Mode)

If you don't configure SendGrid, OTPs are printed to console:

```
=================================================
EMAIL SERVICE NOT CONFIGURED - OTP for testing:
Email: user@example.com
OTP: 123456
Expires at: 2025-12-18T16:30:00
=================================================
```

This is useful for development/testing without email setup.

### With SendGrid Configured

1. Sign up with a valid email address
2. Check your email inbox for the OTP email
3. Subject: "Email Verification - Your OTP Code"
4. Enter the 6-digit code in the app
5. OTP expires in 10 minutes

**Note**: Check your spam folder if you don't see the email immediately.

---

## Troubleshooting

### Error: "Failed to send verification email"

**Cause**: Invalid API key or unauthorized sender

**Solution**:
1. Verify your API key is correct in `application.properties`
2. Ensure no extra spaces or line breaks in the API key
3. Verify the sender email address is authenticated in SendGrid
4. Check SendGrid Activity Feed for delivery errors: https://app.sendgrid.com/email_activity

### Error: "The from address does not match a verified Sender Identity"

**Cause**: Using an email address that hasn't been verified in SendGrid

**Solution**:
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Verify that your sender email is verified (green checkmark)
3. If not, complete the Single Sender Verification or Domain Authentication
4. Update `sendgrid.from.email` to match your verified email

### Error: "Unauthorized"

**Cause**: Invalid or expired API key

**Solution**:
1. Create a new API key with Mail Send permissions
2. Update `sendgrid.api.key` in `application.properties`
3. Ensure the API key has not been revoked

### Emails Not Arriving

**Possible causes**:
1. Email in spam folder - Check spam/junk folder
2. Invalid recipient email - Verify email address is correct
3. SendGrid account suspended - Check account status
4. Rate limit exceeded - Free tier has 100 emails/day limit

**Debugging steps**:
1. Check SendGrid Activity Feed: https://app.sendgrid.com/email_activity
2. Look for the email in the activity log
3. Check the delivery status and any error messages
4. Review backend console logs for detailed errors

### Rate Limiting

SendGrid free tier limits:
- **100 emails per day**
- No credit card required
- Perfect for development and small applications

For production with higher volumes:
- Upgrade to paid plan: https://sendgrid.com/pricing/
- Essential plan starts at $19.95/month for 50,000 emails

---

## Security Best Practices

### 1. Never Commit API Keys to Git

**Bad** ❌:
```properties
sendgrid.api.key=SG.actual-api-key-here
```

**Good** ✅:
```properties
sendgrid.api.key=${SENDGRID_API_KEY:}
```

Set environment variable:
```bash
export SENDGRID_API_KEY=SG.your-api-key-here
```

### 2. Use .gitignore for Local Configs

Add to `.gitignore`:
```
application-local.properties
application-*.properties
!application.properties
*.env
.env.local
```

### 3. Rotate API Keys Regularly

1. Create a new API key
2. Update your application configuration
3. Test that emails are working
4. Delete the old API key from SendGrid

### 4. Use Restricted API Keys

Always use **Restricted Access** API keys with only the permissions needed:
- Enable: Mail Send (Full Access)
- Disable: All other permissions

### 5. Monitor API Key Usage

1. Go to: https://app.sendgrid.com/settings/api_keys
2. Review API key usage and activity
3. Delete unused or compromised keys immediately

---

## Production Deployment

### Environment Variables (Recommended)

For production deployments, use environment variables:

```bash
export SENDGRID_API_KEY="SG.your-api-key-here"
export SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
export SENDGRID_FROM_NAME="Friends Social Network"
```

Update `application.properties`:
```properties
sendgrid.api.key=${SENDGRID_API_KEY:}
sendgrid.from.email=${SENDGRID_FROM_EMAIL:noreply@socialnetwork.com}
sendgrid.from.name=${SENDGRID_FROM_NAME:Friends Social Network}
```

### Docker Deployment

If using Docker, pass environment variables:

```bash
docker run -e SENDGRID_API_KEY="SG.your-key" \
           -e SENDGRID_FROM_EMAIL="noreply@yourdomain.com" \
           -e SENDGRID_FROM_NAME="Your App Name" \
           your-app-image
```

Or use Docker Compose:
```yaml
services:
  app:
    environment:
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - SENDGRID_FROM_EMAIL=${SENDGRID_FROM_EMAIL}
      - SENDGRID_FROM_NAME=${SENDGRID_FROM_NAME}
```

### Cloud Platform Deployment

#### Heroku
```bash
heroku config:set SENDGRID_API_KEY="SG.your-key"
heroku config:set SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
```

#### AWS Elastic Beanstalk
Add environment variables in the EB console under Configuration > Software > Environment properties

#### Google Cloud Platform
```bash
gcloud run services update SERVICE_NAME \
  --set-env-vars SENDGRID_API_KEY="SG.your-key"
```

---

## Monitoring and Analytics

### SendGrid Dashboard

View email statistics at: https://app.sendgrid.com/

Key metrics:
- **Requests**: Total emails sent
- **Delivered**: Successfully delivered emails
- **Opens**: How many recipients opened the email (requires tracking)
- **Clicks**: Link clicks in emails (not applicable for plain text OTPs)
- **Bounces**: Failed deliveries
- **Spam Reports**: Emails marked as spam

### Email Activity Feed

Track individual emails: https://app.sendgrid.com/email_activity

Filter by:
- Recipient email address
- Date range
- Delivery status

---

## Advanced Features (Optional)

### HTML Email Templates

For branded emails, you can enhance the EmailService to send HTML:

```java
Content content = new Content("text/html", 
    "<h1>Welcome!</h1><p>Your OTP: <strong>" + otp + "</strong></p>");
```

### Email Templates

Use SendGrid's Dynamic Templates:
1. Create template at: https://app.sendgrid.com/dynamic_templates
2. Design your email with variables like `{{otp}}`
3. Update EmailService to use template ID

### Email Analytics

Enable tracking in SendGrid settings:
1. Settings > Tracking > Open Tracking
2. Settings > Tracking > Click Tracking

Note: Open tracking requires HTML emails.

---

## Support and Resources

### Official Documentation
- SendGrid Java Library: https://github.com/sendgrid/sendgrid-java
- SendGrid API Reference: https://docs.sendgrid.com/api-reference/
- SendGrid Getting Started: https://docs.sendgrid.com/for-developers/sending-email/api-getting-started

### Common Issues
- Review application logs for detailed error messages
- Check SendGrid Activity Feed for delivery status
- Verify sender authentication is complete
- Ensure API key has Mail Send permissions
- Check rate limits on free tier (100 emails/day)

### Getting Help
1. Check SendGrid Status: https://status.sendgrid.com/
2. SendGrid Support: https://support.sendgrid.com/
3. Community Forums: https://sendgrid.com/community/

### Migration from SMTP

If you previously used SMTP (Gmail or other):
1. Remove old SMTP configuration from `application.properties`
2. Add SendGrid configuration as shown above
3. Restart application
4. Test OTP email sending

No code changes needed - the EmailService handles the switch automatically!

---

## Cost Estimation

### Free Tier (No Credit Card)
- **100 emails/day** = ~3,000 emails/month
- Perfect for: Development, testing, small applications

### Paid Plans (for Production)

| Plan | Emails/Month | Price/Month | Best For |
|------|--------------|-------------|----------|
| Essentials | 50,000 | $19.95 | Growing apps |
| Pro | 100,000 | $89.95 | Production apps |
| Premier | Custom | Custom | Enterprise |

For this OTP feature with 1,000 signups/month:
- Free tier is sufficient if <100 signups/day
- Essentials plan handles up to 50,000 signups/month

---

## Comparison: SendGrid vs SMTP

| Feature | SendGrid | Gmail SMTP |
|---------|----------|------------|
| Setup Complexity | Easy - API key only | Complex - App passwords, 2FA |
| Deliverability | High - Dedicated infrastructure | Medium - Consumer email server |
| Rate Limits | 100/day (free), scalable | 500/day, hard limit |
| Monitoring | Built-in dashboard | None |
| Reliability | 99.9% uptime | Depends on Gmail availability |
| Security | API key rotation | Password management |
| Cost | Free tier, then paid | Always free |
| IP Reputation | Shared/dedicated IPs | Gmail's reputation |

**Recommendation**: SendGrid for production, SMTP for personal testing only.

---

For issues or questions about SendGrid configuration:
1. Check the troubleshooting section above
2. Review SendGrid Activity Feed for delivery errors
3. Verify all configuration steps have been completed
4. Check application logs for detailed error messages
5. Contact SendGrid support or consult their documentation
