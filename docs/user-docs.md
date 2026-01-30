# User Documentation

End-user guides and help:

- [User Guide](user/README.md) - Complete user documentation covering account management, security, notifications, AI features, backup/restore
- [Backup & Restore](backup.md) - Central backup docs (user, admin, and developer); for end users see [User Guide – Backup & Restore](user/README.md#backup--restore)

Administrators can manage users (create, edit, disable, resend verification) from **Configuration > Users**. See [User Guide – Administration (Admins)](user/README.md#administration-admins).

---

## Email Templates (Admin)

Administrators can customize all system-generated emails from **Configuration > Email Templates**.

### Available Templates

| Template | Description |
|----------|-------------|
| Password Reset | Sent when users request password reset |
| Email Verification | Sent to verify user email addresses |
| Welcome | Sent after user registration |
| Notification | Generic notification emails |

### Editing Templates

1. Navigate to **Configuration > Email Templates**
2. Click on a template to edit
3. Modify the subject line and body content
4. Use the **Variable Picker** to insert dynamic values like `{{user.name}}`
5. Preview changes in the right panel
6. Click **Save Changes**

### Testing Templates

- Click **Send Test Email** to send a preview to your email
- Requires email to be properly configured in Mail Settings

### Resetting Templates

- System templates can be reset to defaults via the **Reset** button
- Custom modifications will be lost when resetting

### Email Configuration Requirements

- Valid SMTP or API provider credentials in **Configuration > Mail**
- `from_address` must be a real email (not example.com)

### Features That Depend on Email

- Password reset
- Email verification
- Email notifications
- Email templates (preview and test)

### Troubleshooting Email

- Check **Configuration > Mail** for correct SMTP or API settings
- Use **Send Test Email** from an email template or Mail settings to verify delivery
- Check **Configuration > System** for email configuration status and warnings
