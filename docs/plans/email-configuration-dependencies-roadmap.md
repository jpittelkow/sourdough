# Email Configuration Dependencies Roadmap

Refactor email notifications to properly handle unconfigured state and disable dependent features.

**Priority**: HIGH  
**Status**: Planned  
**Last Updated**: 2026-01-28

**Dependencies**: None

---

## Problem Statement

Currently, email-dependent features (password reset, email verification) may be available in the UI even when email is not properly configured. This creates a poor user experience where users attempt actions that will fail.

**Expected Behavior**:
1. If email SMTP/provider is not configured → email channel should report as not available
2. If email channel is not available → password reset and email verification features should be disabled/hidden
3. Clear indication to admins that email needs configuration for these features

---

## Task Checklist

### Phase 1: Email Configuration Detection

- [ ] Update `EmailChannel` to detect if SMTP/mail provider is properly configured
- [ ] Add `isConfigured()` method that checks for required settings (host, port, credentials)
- [ ] Return `configured: false` in channel metadata when email isn't set up
- [ ] Add configuration status to `/api/settings/notifications` response

### Phase 2: Feature Gating

- [ ] Create helper/service to check if email-dependent features are available
- [ ] Gate password reset functionality on email availability
  - [ ] Disable "Forgot Password" link when email not configured
  - [ ] Return appropriate error if reset attempted without email
- [ ] Gate email verification functionality on email availability
  - [ ] Skip email verification requirement when email not configured
  - [ ] Or: Disable registration entirely if email verification is required but email not configured
- [ ] Add admin notification/warning when email-dependent features are disabled

### Phase 3: Admin UI Improvements

- [ ] Show email configuration status prominently in System Settings
- [ ] Add warning banner when email is not configured but email-dependent features exist
- [ ] Provide clear guidance on how to configure email (SMTP settings, provider API keys)
- [ ] Add "Test Email" functionality to verify configuration

### Phase 4: Documentation

- [ ] Document email configuration requirements
- [ ] Document which features depend on email
- [ ] Add troubleshooting guide for email issues

---

## Implementation Notes

### Email Configuration Check

The `EmailChannel` should check for these settings:
- `MAIL_MAILER` - Must be set to a valid driver (smtp, mailgun, ses, postmark, etc.)
- For SMTP: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- For API providers: Respective API keys

### Feature Dependencies

Features that require email:
1. **Password Reset** - Sends reset link via email
2. **Email Verification** - Sends verification link via email
3. **User Invitations** (if implemented) - Sends invite link via email
4. **Notification emails** - General notification delivery

### Graceful Degradation

When email is not configured:
- Password reset: Show message "Password reset is not available. Contact your administrator."
- Email verification: Either skip requirement or prevent registration
- Notifications: Email channel simply not available; other channels still work

---

## Files Reference

**Backend**:
- `backend/app/Services/Notifications/Channels/EmailChannel.php` - Add configuration detection
- `backend/app/Http/Controllers/Api/AuthController.php` - Gate password reset
- `backend/config/mail.php` - Mail configuration
- `backend/config/notifications.php` - Notification channel config

**Frontend**:
- `frontend/app/(auth)/forgot-password/page.tsx` - Conditionally show/hide
- `frontend/app/(dashboard)/configuration/system/page.tsx` - Show email status
- Login/registration pages - Handle email verification requirement

---

## Success Criteria

- [ ] Email channel correctly reports configured/unconfigured status
- [ ] Password reset is unavailable when email not configured
- [ ] Email verification requirement is handled appropriately
- [ ] Admins have clear visibility into email configuration status
- [ ] No silent failures for email-dependent features
