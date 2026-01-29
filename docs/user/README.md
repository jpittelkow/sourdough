# Sourdough User Guide

Welcome to Sourdough! This guide will help you get started with the application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Security Settings](#security-settings)
4. [Notifications](#notifications)
5. [AI/LLM Features](#aillm-features)
6. [Backup & Restore](#backup--restore)

---

## Getting Started

### System Requirements

- **Docker**: Docker 20.10+ and Docker Compose 2.0+
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Installation

#### Using Docker (Recommended)

```bash
# Pull and run
docker run -d \
  --name sourdough \
  -p 8080:80 \
  -v sourdough_data:/data \
  ghcr.io/username/sourdough:latest

# Access at http://localhost:8080
```

#### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/username/sourdough.git
cd sourdough

# Start services
docker-compose up -d

# Access at http://localhost:8080
```

### First-Time Setup

1. Navigate to `http://localhost:8080`
2. Click "Register" to create your account
3. Complete the registration form
4. Verify your email (if email is configured)
5. Login to access the dashboard

---

## Account Management

### Creating an Account

1. Click **Register** on the login page
2. Enter your details:
   - Name
   - Email address
   - Password (min 8 characters)
3. Click **Create Account**
4. Check your email for verification link

### Logging In

#### Email/Password Login
1. Enter your email and password
2. Click **Sign In**
3. If 2FA is enabled, enter your code

#### SSO Login
1. Click the SSO provider button (Google, GitHub, etc.)
2. Authorize the application
3. You'll be redirected to the dashboard

### Profile Settings

Access via **Settings > Profile**

- **Name**: Your display name
- **Email**: Your email address (requires verification if changed)
- **Avatar**: Upload a profile picture
- **Timezone**: Your preferred timezone

### Changing Password

1. Go to **Settings > Profile**
2. Click **Change Password**
3. Enter your current password
4. Enter and confirm your new password
5. Click **Update Password**

### Deleting Your Account

1. Go to **Settings > Profile**
2. Scroll to **Danger Zone**
3. Click **Delete Account**
4. Confirm by typing your email
5. Click **Permanently Delete**

> **Warning**: This action is irreversible. All your data will be permanently deleted.

---

## Security Settings

Access via **Settings > Security**

### Two-Factor Authentication (2FA)

2FA adds an extra layer of security by requiring a code from your phone.

#### Enabling 2FA

1. Go to **Settings > Security**
2. Click **Enable Two-Factor Authentication**
3. Scan the QR code with an authenticator app:
   - Google Authenticator
   - Authy
   - 1Password
   - Microsoft Authenticator
4. Enter the 6-digit code from the app
5. **Save your recovery codes** in a secure location

#### Using 2FA

When logging in:
1. Enter your email and password
2. Enter the 6-digit code from your authenticator app
3. Or use a recovery code if you don't have your device

#### Recovery Codes

- 10 one-time codes are generated when you enable 2FA
- Each code can only be used once
- Store them securely (password manager, printed copy)
- Regenerate codes if you've used several

#### Disabling 2FA

1. Go to **Settings > Security**
2. Click **Disable Two-Factor Authentication**
3. Enter your password to confirm
4. 2FA is now disabled

### Connected Accounts (SSO)

View and manage linked social accounts:

1. Go to **Settings > Security**
2. See **Connected Accounts** section
3. Click **Connect** to link a new provider
4. Click **Disconnect** to unlink a provider

### Active Sessions

View and manage your login sessions:

1. Go to **Settings > Security**
2. See **Active Sessions** section
3. Click **Revoke** to end a specific session
4. Click **Revoke All** to sign out everywhere

---

## Notifications

### In-App Notifications

View and manage notifications from the header and dedicated notifications page:

- **Bell icon**: In the top bar. Shows an unread count badge. Click to open a dropdown with recent notifications.
- **Dropdown**: Lists recent notifications, **Mark all read**, and **View all** to open the full list.
- **Notifications page**: Go to **/notifications** (or click **View all**). Filter by **All** or **Unread**, mark items read, delete selected, and paginate through the list.

When real-time updates are enabled (Pusher/broadcasting), new in-app notifications appear immediately without refreshing.

### Notification Channels

Configure how you receive notifications via **Configuration > Notifications** (admin) or your user settings.

| Channel | Setup Required |
|---------|----------------|
| In-App | None (always enabled) |
| Email | Valid email address |
| Telegram | Bot token + Chat ID |
| Discord | Webhook URL |
| Slack | Webhook URL |
| SMS | Phone number |

### Channel Setup

#### Email
Email notifications use your account email by default.

#### Telegram
1. Start a chat with [@BotFather](https://t.me/botfather)
2. Create a new bot and get the token
3. Start a chat with your bot
4. Enter your Chat ID in settings

#### Discord
1. Go to your Discord server settings
2. Create a webhook in the desired channel
3. Copy the webhook URL
4. Paste it in Sourdough settings

#### Slack
1. Go to your Slack workspace settings
2. Create an incoming webhook
3. Copy the webhook URL
4. Paste it in Sourdough settings

### Notification Types

Choose which events trigger notifications:

- **Security Alerts**: Login from new device, password changed
- **System Updates**: New version available
- **Backup Events**: Backup completed, backup failed
- **AI Usage**: Usage warnings, quota alerts

---

## AI/LLM Features

Access via **Settings > AI**

### Configuring AI Providers

Sourdough supports multiple AI providers. Configure the ones you want to use:

#### Claude (Anthropic)
1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Enter the key in **Settings > AI > Claude**
3. Select your preferred model

#### OpenAI
1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Enter the key in **Settings > AI > OpenAI**
3. Select your preferred model

#### Gemini (Google)
1. Get an API key from [makersuite.google.com](https://makersuite.google.com)
2. Enter the key in **Settings > AI > Gemini**
3. Select your preferred model

#### Ollama (Local)
1. Install Ollama on your machine or server
2. Enter the Ollama server URL
3. Select from available models

### Operating Modes

#### Single Mode
- Queries one provider directly
- Fastest and most cost-effective
- Best for: General use, cost-conscious users

#### Aggregation Mode
- Queries all enabled providers
- Primary provider synthesizes responses
- Best for: Complex questions, getting multiple perspectives

#### Council Mode
- All providers vote on the response
- Consensus-based final answer
- Best for: Critical decisions, fact verification

### Usage Tracking

View your AI usage:

1. Go to **Settings > AI**
2. See **Usage Statistics**:
   - Total requests
   - Tokens used
   - Estimated cost
   - Usage by provider

---

## Backup & Restore

Access via **Configuration > Backup** (admin users only). Full backup documentation: [Backup & Restore (docs hub)](../backup.md).

The Backup page has two tabs:

- **Backups** – Create, download, restore, and delete backups.
- **Settings** – Configure retention, schedule, and remote destinations (S3, SFTP, Google Drive). Admins with **manage-settings** can edit these; changes take effect without restart.

### Creating a Backup

1. Go to **Configuration > Backup**
2. Open the **Backups** tab
3. Click **Create Backup**
4. Wait for the backup to complete
5. Download the backup file if desired

### What's Included in Backups

- **Database** – All application data (users, settings, notifications, etc.)
- **Uploaded files** – Everything under storage (avatars, attachments, etc.)
- **Application settings** – Stored in the database (sensitive values handled securely)

Backups are ZIP archives with a manifest (version 2.0). See [ADR-007: Backup System Design](../adr/007-backup-system-design.md) for format details.

### Downloading Backups

1. Go to **Configuration > Backup** > **Backups** tab
2. Find the backup in the list (filename, size, date)
3. Click **Download**
4. Save the `.zip` file securely

### Restoring from Backup

1. Go to **Configuration > Backup** > **Backups** tab
2. Either choose an existing backup and click **Restore**, or use **Upload Backup** to select a `.zip` file
3. In the restore dialog, type **RESTORE** to confirm
4. Click **Restore Backup**

> **Warning**: Restoring replaces all current data (database, files, settings). This action cannot be undone.

### Backup Settings (Admins)

Under **Configuration > Backup** > **Settings** tab you can configure:

- **Retention** – How long to keep backups and how many to keep
- **Schedule** – Enable scheduled backups; set frequency (daily/weekly/monthly), time, and destinations
- **S3 / SFTP / Google Drive** – Remote storage credentials; use **Test Connection** after saving to verify
- **Encryption** – Optional password-based encryption for backup files
- **Notifications** – Notify on backup success or failure (when notifications are configured)

Save changes with **Save Changes**. Test Connection uses the saved settings; save before testing if you just edited credentials.

### Scheduled Backups

If enabled by your administrator in **Configuration > Backup** > **Settings**:

- Backups run automatically (daily, weekly, or monthly)
- Retention rules clean up old backups
- Backups can be stored locally and/or remotely (S3, SFTP, Google Drive)

---

## Troubleshooting

### Can't Login

- Verify your email and password
- Check if your account is verified
- Try resetting your password
- Clear browser cookies and try again

### 2FA Code Not Working

- Ensure your device time is accurate
- Try the next code (codes change every 30 seconds)
- Use a recovery code if needed

### Not Receiving Emails

- Check your spam/junk folder
- Verify your email address is correct
- Contact your administrator

### SSO Login Failed

- Ensure the provider is enabled
- Try logging in with email/password
- Clear browser cookies
- Contact your administrator

---

## Getting Help

- **Documentation**: [docs/](../)
- **Issues**: [GitHub Issues](https://github.com/username/sourdough/issues)
- **Email**: support@example.com
