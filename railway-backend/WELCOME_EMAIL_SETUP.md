# Welcome Email Setup Guide

## Overview

Study Buddy now sends welcome emails to new users when they sign up (both web app and mobile app). The email service uses Resend API.

## How It Works

1. User signs up via Google OAuth (web or mobile)
2. Backend creates user account
3. Welcome email is automatically sent (non-blocking)
4. User receives email with welcome message and getting started guide

## Setup Instructions

### Step 1: Sign Up for Resend

1. Go to [Resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "Study Buddy Production")
4. Copy the API key (starts with `re_`)

### Step 3: Verify Your Domain (Optional but Recommended)

**For Production:**
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Add your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain's DNS
5. Wait for verification (usually a few minutes)

**For Testing:**
- You can use Resend's test domain: `onboarding@resend.dev`
- This works immediately but emails will show "via resend.dev"

### Step 4: Add Environment Variables to Railway

Go to your Railway backend service → **Variables** tab and add:

```bash
# Resend API Key (required)
RESEND_API_KEY=re_your_api_key_here

# From Email Address (required)
# Use your verified domain or Resend test domain
FROM_EMAIL=noreply@yourdomain.com
# OR for testing:
# FROM_EMAIL=onboarding@resend.dev

# Web App URL (optional, defaults to CORS_ORIGIN)
# Used in the email's "Get Started" button
WEB_APP_URL=https://your-web-app-domain.com
```

### Step 5: Deploy

After adding the environment variables, Railway will automatically redeploy. The welcome emails will start working immediately.

## Testing

### Test Email Sending

1. Create a test user account
2. Check your email inbox
3. You should receive the welcome email within a few seconds

### Check Logs

In Railway backend logs, you should see:
- `✅ Welcome email sent to user@example.com (ID: ...)` - Success
- `⚠️ RESEND_API_KEY not configured. Skipping welcome email.` - API key missing
- `❌ Failed to send welcome email: ...` - Error occurred

## Email Template

The welcome email includes:
- Personalized greeting with user's name
- Overview of Study Buddy features
- "Get Started" button linking to web app
- Professional branding and styling

## Troubleshooting

### Email Not Sending

1. **Check API Key:**
   - Verify `RESEND_API_KEY` is set correctly in Railway
   - Make sure it starts with `re_`
   - Check it's not expired in Resend dashboard

2. **Check From Email:**
   - Verify `FROM_EMAIL` is set
   - If using custom domain, ensure it's verified in Resend
   - For testing, use `onboarding@resend.dev`

3. **Check Logs:**
   - Look for error messages in Railway backend logs
   - Check Resend dashboard for delivery status

4. **Check Spam Folder:**
   - Welcome emails might go to spam initially
   - Consider setting up SPF/DKIM records for your domain

### Email Sending But Not Receiving

1. Check spam/junk folder
2. Verify email address is correct
3. Check Resend dashboard for delivery status
4. Some email providers block emails from new domains

## Cost

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for getting started

**Resend Pro ($20/month):**
- 50,000 emails/month
- Higher sending limits
- Better deliverability

## Security Notes

- ✅ API key is stored securely in Railway environment variables
- ✅ Email sending is non-blocking (won't break user creation if it fails)
- ✅ Email addresses are only used for transactional emails
- ✅ No email addresses are shared with third parties

## Customization

To customize the email template, edit:
- `railway-backend/services/email-service.ts`
- Method: `getWelcomeEmailTemplate()`

## Support

If you need help:
1. Check Resend documentation: https://resend.com/docs
2. Check Railway logs for error messages
3. Verify all environment variables are set correctly

