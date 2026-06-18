# Email verification and forgot password

This version includes first-time registration verification and forgot-password reset codes.

## Registration flow

1. Customer enters name, phone, email and password.
2. Backend creates the account as `emailVerified: false`.
3. Backend sends a 6-digit verification code to the customer's email.
4. Customer enters the code on the website.
5. Backend verifies the code, sets `emailVerified: true`, and logs the customer in.

The code expires after 10 minutes.

## Forgot password flow

1. Customer clicks **Forgot password?**.
2. Customer enters their email.
3. Backend sends a 6-digit reset code if the account exists.
4. Customer enters the code and new password.
5. Backend verifies the code, saves the new password, and logs the customer in.

The reset code expires after 10 minutes.

## SMTP email setup

In `backend/.env`, add real SMTP settings:

```env
EMAIL_FROM="GlowBelle <noreply@yourdomain.com>"
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

If SMTP is empty in development, emails are skipped and the code is printed in the backend terminal. This helps you test locally without paying for an email provider.

## Production reminder

Before launching to real customers, use a proper email provider such as SendGrid, Mailgun, Brevo, Resend, Zoho Mail, or Google Workspace SMTP.
