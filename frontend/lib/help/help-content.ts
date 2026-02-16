import { type LucideIcon, Book, Shield, Bell, Settings, User, Users, FileText, Brain, Database, BarChart3 } from "lucide-react";

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

export interface HelpCategory {
  slug: string;
  name: string;
  icon?: LucideIcon;
  articles: HelpArticle[];
  /** Permission required to see this category. Omit for categories visible to all authenticated users. */
  permission?: string;
}

// ---------------------------------------------------------------------------
// User-facing help categories (no permission required)
// ---------------------------------------------------------------------------
export const userHelpCategories: HelpCategory[] = [
  {
    slug: "getting-started",
    name: "Getting Started",
    icon: Book,
    articles: [
      {
        id: "welcome",
        title: "Welcome to Sourdough",
        tags: ["intro", "overview", "start"],
        content: `# Welcome to Sourdough

Sourdough is a modern application template designed for building secure, feature-rich web applications.

## Key Features

- **Secure Authentication** - Multiple sign-in options including email/password, passkeys, and SSO
- **Responsive Design** - Works great on desktop, tablet, and mobile devices
- **Progressive Web App** - Install as a standalone app on your device
- **Dark Mode** - Switch between light and dark themes

## Getting Help

If you need assistance:

1. Browse the help articles in this center
2. Use the search bar to find specific topics
3. Press **?** at any time to open this help center

Welcome aboard!`,
      },
      {
        id: "navigation",
        title: "Navigating the App",
        tags: ["menu", "sidebar", "navigate"],
        content: `# Navigating the App

## Main Navigation

The sidebar on the left provides quick access to all main sections:

- **Dashboard** - Your home page with key information
- **Search** - Find content across the application

## User Menu

Click your profile picture in the top-right corner to access:

- Profile settings
- Security options
- Theme preferences
- Sign out

## Keyboard Shortcuts

- **?** - Open this help center
- **Ctrl+K** / **Cmd+K** - Open search
- **Esc** - Close dialogs`,
      },
      {
        id: "search",
        title: "Using Search",
        tags: ["search", "find", "filter"],
        content: `# Using Search

## Quick Search

Press **Ctrl+K** (or **Cmd+K** on Mac) to open the global search.

Type your query to search across:
- Pages and navigation
- Help articles
- Content

## Search Tips

- Use specific keywords for better results
- Search is case-insensitive
- Results update as you type

## Filtering Results

Search results are grouped by type. Click on a result to navigate directly to that item.`,
      },
      {
        id: "theme-appearance",
        title: "Theme & Appearance",
        tags: ["theme", "dark", "light", "appearance", "customization"],
        content: `# Theme & Appearance

Customize how the application looks to match your preferences.

## Theme Options

You can choose from three theme modes:

- **Light** - Bright interface for well-lit environments
- **Dark** - Dark interface that's easier on the eyes
- **System** - Automatically matches your device's theme (light or dark)

## Changing Your Theme

1. Click your profile picture in the top-right
2. Select **Preferences** or use the theme toggle in the header
3. Choose Light, Dark, or System

## Theme Persistence

Your theme preference is saved and will persist across sessions and devices.`,
      },
      {
        id: "timezone-settings",
        title: "Timezone Settings",
        tags: ["timezone", "time", "regional", "date", "time zone"],
        content: `# Timezone Settings

Control how dates and times are displayed throughout the application.

## How Timezone Is Set

Your timezone is **automatically detected** from your browser when you first log in or register. You can override it manually at any time.

## Changing Your Timezone

1. Click your profile picture in the top-right
2. Select **Preferences**
3. Find the **Regional** card
4. Choose your preferred timezone from the dropdown
5. Select "Use system default" to revert to automatic detection

## Timezone Fallback

If you haven't set a personal timezone, the app uses this fallback chain:

1. **Your personal setting** (set in Preferences)
2. **System default** (set by an administrator in System Settings)
3. **Server timezone** (UTC by default)

## Where Timezone Applies

Your timezone affects all dates and times shown in the app, including:

- Notification timestamps
- Audit log entries
- Backup timestamps
- Activity history`,
      },
      {
        id: "changelog",
        title: "Changelog & Version History",
        tags: ["changelog", "version", "release", "updates", "what's new"],
        content: `# Changelog & Version History

Stay up to date with the latest changes and improvements.

## Viewing the Changelog

1. Go to **Configuration** → **Changelog**
2. Browse entries grouped by version number
3. Each version shows its release date and categorized changes

## Entry Categories

Changes are organized into sections:

- **Added** - New features and capabilities
- **Changed** - Modifications to existing functionality
- **Fixed** - Bug fixes and corrections
- **Removed** - Features that have been removed
- **Security** - Security-related updates

## Older Versions

Older version entries are collapsible to keep the page clean. Click on a version header to expand its details.`,
      },
    ],
  },
  {
    slug: "account",
    name: "Your Account",
    icon: User,
    articles: [
      {
        id: "profile",
        title: "Managing Your Profile",
        tags: ["profile", "account", "settings"],
        content: `# Managing Your Profile

## Updating Your Profile

1. Click your profile picture in the top-right
2. Select **Profile**
3. Update your information:
   - Display name
   - Email address
   - Profile picture

## Email Changes

When you change your email:
- A verification email is sent to the new address
- Your old email remains active until verification
- Click the link in the verification email to confirm

## Profile Picture

Upload a profile picture by:
1. Clicking the avatar area
2. Selecting an image file
3. Cropping if needed`,
      },
      {
        id: "password",
        title: "Changing Your Password",
        tags: ["password", "security", "change"],
        content: `# Changing Your Password

## How to Change Your Password

1. Go to **Profile** → **Security**
2. Click **Change Password**
3. Enter your current password
4. Enter and confirm your new password
5. Click **Save**

## Password Requirements

Your password must:
- Be at least 8 characters (configurable by admin)
- Not be a commonly used password
- Not be similar to your email

## Password Security Tips

- Use a unique password for this application
- Consider using a password manager
- Enable two-factor authentication for extra security`,
      },
    ],
  },
  {
    slug: "security",
    name: "Security",
    icon: Shield,
    articles: [
      {
        id: "two-factor",
        title: "Two-Factor Authentication",
        tags: ["2fa", "two-factor", "authenticator", "security"],
        content: `# Two-Factor Authentication

Two-factor authentication (2FA) adds an extra layer of security to your account.

## Setting Up 2FA

1. Go to **Profile** → **Security**
2. Find the **Two-Factor Authentication** section
3. Click **Enable**
4. Scan the QR code with your authenticator app
5. Enter the verification code
6. Save your recovery codes

## Supported Authenticator Apps

- Google Authenticator
- Authy
- Microsoft Authenticator
- 1Password
- Any TOTP-compatible app

## Recovery Codes

When enabling 2FA, you'll receive recovery codes. **Store these securely!**

If you lose access to your authenticator:
1. Use a recovery code to sign in
2. Each code can only be used once
3. Regenerate codes if running low`,
      },
      {
        id: "passkeys",
        title: "Using Passkeys",
        tags: ["passkey", "webauthn", "biometric", "fingerprint"],
        content: `# Using Passkeys

Passkeys are a more secure and convenient way to sign in without passwords.

## What are Passkeys?

Passkeys use biometrics (fingerprint, face) or device PIN to authenticate you. They're:

- **More secure** - Can't be phished or stolen
- **Easier to use** - No passwords to remember
- **Device-synced** - Work across your devices

## Setting Up a Passkey

1. Go to **Profile** → **Security**
2. Find the **Passkeys** section
3. Click **Add Passkey**
4. Follow your device's prompts
5. Name your passkey for identification

## Signing In with Passkeys

1. Click **Sign in with Passkey** on the login page
2. Use your fingerprint, face, or device PIN
3. You're signed in!

## Managing Passkeys

View and remove your passkeys from **Profile** → **Security**. We recommend having at least two passkeys registered.`,
      },
      {
        id: "sessions",
        title: "Managing Sessions",
        tags: ["session", "devices", "logout"],
        content: `# Managing Sessions

## Active Sessions

View all devices where you're signed in:

1. Go to **Profile** → **Security**
2. Scroll to **Active Sessions**
3. See device type, location, and last activity

## Signing Out Remotely

If you see an unfamiliar session:

1. Click **Revoke** next to the session
2. That device will be signed out immediately
3. Consider changing your password if suspicious

## Session Security

- Sessions expire after a period of inactivity
- Closing your browser doesn't always end the session
- Use **Sign out** when on shared devices`,
      },
    ],
  },
  {
    slug: "notifications",
    name: "Notifications",
    icon: Bell,
    articles: [
      {
        id: "notification-settings",
        title: "Notification Settings",
        tags: ["notifications", "alerts", "preferences"],
        content: `# Notification Settings

## Configuring Notifications

1. Go to **Profile** → **Notifications**
2. Choose your preferences for each notification type:
   - **In-app** - Notifications within the application
   - **Email** - Notifications sent to your email
   - **Push** - Browser/device push notifications

## Push Notifications

To receive push notifications:

1. Enable push notifications in settings
2. Allow notifications when prompted by your browser
3. Ensure browser notifications aren't blocked

## Notification Types

Different events may have different notification options:
- Security alerts (login, password changes)
- Account updates
- System announcements

Some critical security notifications cannot be disabled.`,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Permission-gated help categories (shown based on user permissions)
// ---------------------------------------------------------------------------
export const permissionHelpCategories: HelpCategory[] = [
  // --- Administration (settings.view) ---
  {
    slug: "administration",
    name: "Administration",
    icon: Settings,
    permission: "settings.view",
    articles: [
      {
        id: "admin-overview",
        title: "Administration Overview",
        tags: ["admin", "settings", "configuration"],
        content: `# Administration Overview

As an administrator, you have access to system-wide settings and user management.

## Admin Areas

- **System Settings** - Configure application behavior
- **Security Settings** - Set security policies
- **User Management** - Manage user accounts
- **Audit Logs** - Review system activity

## Accessing Admin Settings

1. Click your profile in the top-right
2. Select **Configuration**
3. Navigate through the admin sections

## Best Practices

- Review audit logs regularly
- Keep security settings appropriately strict
- Test changes in a non-production environment first`,
      },
      {
        id: "branding",
        title: "Branding & Customization",
        tags: ["branding", "logo", "colors", "theme", "visual"],
        content: `# Branding & Customization

Customize the application's visual identity for your organization.

## Branding Options

- **Application Name** - The name displayed in the header and page titles
- **Logo** - Upload a custom logo for the sidebar and login page
- **Theme Palette** - Choose primary accent colors for buttons and links
- **Favicon** - Browser tab icon

## Configuring Branding

1. Go to **Configuration** → **Theme & Branding**
2. Upload your logo or enter the application name
3. Select your preferred color palette
4. Save your changes

## Logo Guidelines

- Use high-resolution images for best display
- Transparent backgrounds work well for logos
- Recommended aspect ratio: square or landscape`,
      },
    ],
  },
  // --- User Management (users.view) ---
  {
    slug: "user-management",
    name: "User Management",
    icon: Users,
    permission: "users.view",
    articles: [
      {
        id: "user-management",
        title: "User Management",
        tags: ["users", "admin", "accounts", "manage"],
        content: `# User Management

## Viewing Users

Go to **Configuration** → **Users** to see all registered users.

You can:
- Search and filter users
- View user details
- Modify user roles
- Disable or delete accounts

## User Roles

- **User** - Standard access
- **Admin** - Full administrative access

## Modifying Users

1. Find the user in the list
2. Click on their row
3. Make changes
4. Save

## Disabling Accounts

Disabled accounts:
- Cannot sign in
- Retain their data
- Can be re-enabled later`,
      },
    ],
  },
  // --- Groups (groups.view) ---
  {
    slug: "groups",
    name: "Groups & Permissions",
    icon: Users,
    permission: "groups.view",
    articles: [
      {
        id: "groups-management",
        title: "User Groups & Permissions",
        tags: ["groups", "permissions", "roles", "members", "access"],
        content: `# User Groups & Permissions

Organize users into groups and control what they can access.

## What are Groups?

Groups define sets of permissions. Users can belong to multiple groups, and their effective permissions are the union of all group permissions.

## Managing Groups

1. Go to **Configuration** → **Groups**
2. View existing groups and their members
3. Create new groups or edit existing ones

## Built-in Groups

- **Administrators** - Full access to all features and settings
- **Users** - Default group for standard users

## Permission Matrix

Each group has a permission matrix that controls access to:

- **Users** - View, create, edit, delete user accounts
- **Groups** - View and manage groups
- **Settings** - View and edit system settings
- **Backups** - View, create, restore, delete backups
- **Logs** - View and export logs, view audit logs
- **Usage** - View integration usage and costs

## Assigning Users to Groups

1. Go to **Configuration** → **Users**
2. Click on a user
3. Use the group picker to assign groups
4. Save changes`,
      },
    ],
  },
  // --- Security & Access (settings.view) ---
  {
    slug: "security-access",
    name: "Security & Access",
    icon: Shield,
    permission: "settings.view",
    articles: [
      {
        id: "security-settings",
        title: "Security Configuration",
        tags: ["security", "policy", "admin", "2fa", "password"],
        content: `# Security Configuration

## Authentication Settings

Configure how users authenticate:

- **Email Verification** - Require verified emails
- **Two-Factor Authentication** - Require/optional 2FA
- **Passkey Mode** - Passkey requirements

## Password Policy

Set password requirements:

- Minimum length
- Complexity requirements
- Maximum login attempts

## Session Settings

- **Session Timeout** - Auto-logout after inactivity
- **Concurrent Sessions** - Allow multiple devices

## SSO Configuration

If using Single Sign-On:

- Enable/disable providers
- Configure account linking
- Set auto-registration rules`,
      },
      {
        id: "sso-configuration",
        title: "SSO Configuration",
        tags: ["sso", "oauth", "google", "github", "single sign-on"],
        content: `# SSO Configuration

Enable Single Sign-On so users can sign in with external identity providers.

## Supported Providers

- **Google** - Sign in with Google
- **GitHub** - Sign in with GitHub
- **GitLab** - Sign in with GitLab
- **Microsoft/Azure AD** - Sign in with Microsoft account
- **Discord** - Sign in with Discord
- **OIDC** - Any OpenID Connect compatible provider

## Adding a Provider

1. Go to **Configuration** → **SSO**
2. Create an application in your provider's developer console
3. Copy the Client ID and Client Secret
4. Add the redirect URI shown in the configuration page
5. Paste credentials into the form
6. Use **Test Connection** to verify

## Account Linking

When **Allow Account Linking** is enabled, users with an existing email/password account can link their SSO provider. When disabled, SSO creates a new account for new users only.

## Auto-Registration

Enable **Auto-Register** to allow new users to create accounts via SSO without manual approval. Disable to require admin approval first.`,
      },
      {
        id: "api-webhooks",
        title: "API & Webhooks",
        tags: ["api", "tokens", "webhooks", "integration", "automation"],
        content: `# API & Webhooks

Manage programmatic access and event-driven integrations.

## API Tokens

Create personal access tokens for API authentication:

1. Go to **Configuration** → **API & Webhooks**
2. Click **Create Token**
3. Name your token and copy the value (shown only once)
4. Use the token in your API requests via the Authorization header

Tokens expire after 7 days by default. Revoke unused tokens promptly.

## Webhooks

Configure outgoing webhooks to notify external systems when events occur:

1. Go to **Configuration** → **API & Webhooks**
2. Click **Add Webhook**
3. Enter the endpoint URL and select events to subscribe to
4. Optionally set a secret for payload signature verification

## Available Webhook Events

- \`user.created\`, \`user.updated\`, \`user.deleted\`
- \`backup.completed\`, \`backup.failed\`
- \`settings.updated\`

## Webhook Security

When a secret is configured, each delivery includes an HMAC-SHA256 signature in the \`X-Webhook-Signature\` header for payload verification.`,
      },
    ],
  },
  // --- Communications (settings.view) ---
  {
    slug: "communications",
    name: "Communications",
    icon: Bell,
    permission: "settings.view",
    articles: [
      {
        id: "email-configuration",
        title: "Email Configuration",
        tags: ["email", "smtp", "mailgun", "sendgrid", "delivery"],
        content: `# Email Configuration

Configure how the application sends email for notifications, password resets, and verification.

## Supported Drivers

- **SMTP** - Standard SMTP server (Gmail, Office 365, custom)
- **Mailgun** - Transactional email service
- **SendGrid** - Transactional email service
- **AWS SES** - Amazon Simple Email Service
- **Postmark** - Transactional email service

## Setup Steps

1. Go to **Configuration** → **Email**
2. Select your mail driver
3. Enter the required credentials (host, port, username, password)
4. Configure TLS/SSL encryption settings
5. Set the "From" address and name
6. Use **Test Connection** to verify

## Troubleshooting

- Ensure firewall allows outbound SMTP (port 25, 465, or 587)
- For Gmail, use an App Password, not your regular password
- Check that "From" address is verified with your provider`,
      },
      {
        id: "email-templates",
        title: "Email Templates",
        tags: ["email", "templates", "variables", "customize"],
        content: `# Email Templates

Customize the content of system emails sent to users.

## Available Templates

- Password reset
- Email verification
- Welcome email
- Notification digests

## Editing Templates

1. Go to **Configuration** → **Email Templates**
2. Select the template to edit
3. Modify the subject line and body
4. Use the variable picker to insert dynamic content (e.g., user name, reset link)
5. Preview before saving

## Template Variables

Each template supports variables that are replaced at send time:
- **{{user.name}}** - User's display name
- **{{user.email}}** - User's email address
- **{{reset_link}}** - Password reset URL (password reset template)
- **{{verification_link}}** - Email verification URL

Available variables are shown in the variable picker for each template.`,
      },
      {
        id: "notification-channels",
        title: "Notification Channels",
        tags: ["notifications", "channels", "telegram", "discord", "slack", "sms", "push", "admin"],
        content: `# Notification Channels

Configure which notification channels are available to users.

## Available Channels

- **Email** - Notifications via email (requires email configuration)
- **Telegram** - Notifications via Telegram bot
- **Discord** - Notifications via Discord webhook
- **Slack** - Notifications via Slack webhook
- **SMS** - SMS via Twilio, Vonage, or AWS SNS
- **Matrix** - Notifications via Matrix homeserver
- **ntfy** - Push notifications via ntfy service
- **Web Push** - Browser push notifications (VAPID)
- **In-App** - In-application notification bell

## Enabling Channels

1. Go to **Configuration** → **Notifications**
2. Enable the channels you want to make available
3. Enter the required credentials for each channel (API keys, webhook URLs, etc.)
4. Use **Test** to verify the channel works

## User vs Admin Configuration

Admins enable which channels are available system-wide. Users then enable their preferred channels and enter personal details (phone number, webhook URLs) in **User Preferences**.`,
      },
      {
        id: "notification-templates",
        title: "Notification Templates",
        tags: ["notification", "templates", "push", "inapp", "chat", "customize"],
        content: `# Notification Templates

Customize the content of push, in-app, and chat notifications.

## Template Types

Each notification type (e.g., backup completed, login alert) has templates for three channel groups:

- **Push** - Web Push, FCM, ntfy
- **In-App** - Database channel (notification bell)
- **Chat** - Telegram, Discord, Slack, SMS, Matrix

## Editing Templates

1. Go to **Configuration** → **Notification Templates**
2. Select the notification type
3. Edit the title and body for each channel group
4. Use the **Available Variables** panel to insert dynamic content
5. Preview before saving

## Template Variables

Variables use double-brace syntax: \`{{variable}}\`. Each template type shows its available variables in a collapsible reference panel.

## Resetting Templates

Click **Reset to Default** to restore the original system template content.`,
      },
      {
        id: "novu-configuration",
        title: "Novu Configuration",
        tags: ["novu", "notification", "infrastructure", "workflows"],
        content: `# Novu Configuration

Optionally use Novu for advanced notification workflows and a rich notification inbox.

## What is Novu?

Novu is a notification infrastructure platform that provides workflow orchestration, a notification inbox UI, and multi-channel delivery.

## Enabling Novu

1. Go to **Configuration** → **Novu**
2. Enter your Novu API Key and Application Identifier
3. Enable Novu integration
4. Save settings

## When Novu is Enabled

- The header notification bell uses the Novu Inbox component
- Notifications are routed through Novu's API
- Users are synced as Novu subscribers

## When Novu is Disabled

The built-in notification system and templates are used instead. You can switch between modes at any time.`,
      },
    ],
  },
  // --- Integrations (settings.view) ---
  {
    slug: "integrations",
    name: "Integrations",
    icon: Brain,
    permission: "settings.view",
    articles: [
      {
        id: "ai-llm-settings",
        title: "AI / LLM Settings",
        tags: ["ai", "llm", "openai", "anthropic", "models", "providers"],
        content: `# AI / LLM Settings

Configure AI providers and large language models for features that use AI.

## Supported Providers

- **OpenAI** - GPT-4, GPT-3.5
- **Anthropic** - Claude models
- **Google** - Gemini, Vertex AI
- **AWS Bedrock** - Various models via Amazon
- **Azure OpenAI** - OpenAI models via Azure
- **Ollama** - Local models
- **Groq** - Fast inference
- **Mistral** - Mistral models

## Adding a Provider

1. Go to **Configuration** → **AI / LLM**
2. Click **Add Provider**
3. Select the provider type
4. Enter your API key (stored securely)
5. Use **Test Key** to verify
6. Optionally use **Fetch Models** to discover available models

## Orchestration Modes

- **Single** - Use one primary provider
- **Council** - Multiple providers vote on responses (for reliability)
- **Fallback** - Try primary, fall back to secondary on failure

## Model Selection

Select a default model per provider. Models with "Fetch Models" can discover available models from the provider's API.`,
      },
      {
        id: "storage-settings",
        title: "Storage Configuration",
        tags: ["storage", "s3", "disk", "upload", "files", "provider"],
        content: `# Storage Configuration

Configure where files are stored and manage storage settings.

## Supported Drivers

- **Local** - Files stored on the server's filesystem
- **Amazon S3** - AWS S3 or compatible services
- **Google Cloud Storage** - GCS with service account
- **Azure Blob Storage** - Azure container storage
- **DigitalOcean Spaces** - S3-compatible object storage
- **MinIO** - Self-hosted S3-compatible storage
- **Backblaze B2** - Affordable cloud storage

## Configuration Steps

1. Go to **Configuration** → **Storage**
2. Select your storage driver
3. Enter the required credentials (bucket, region, keys)
4. Set maximum upload size and allowed file types
5. Use **Test Connection** to verify (non-local drivers)

## Storage Health

The storage page shows:

- **Disk usage** - Current usage and available space
- **Storage paths** - Where different types of files are stored
- **Health status** - Warnings when disk usage is high or storage is not writable

## File Manager

Access **Manage Files** to browse, upload, download, and delete files directly.`,
      },
      {
        id: "search-config",
        title: "Search Configuration",
        tags: ["search", "meilisearch", "indexing", "admin"],
        content: `# Search Configuration

## How Search Works

The application uses Meilisearch for fast, typo-tolerant search.

## Reindexing

If search results seem outdated:

1. Go to **Configuration** → **Search**
2. View index statistics and document counts
3. Click **Reindex** for a specific model or **Reindex All**
4. Wait for completion

## Search Health

Monitor search status:

- **Connected** - Search is working
- **Disconnected** - Check Meilisearch service
- **Indexing** - Rebuild in progress

## Troubleshooting

If search isn't working:

1. Check Meilisearch service status
2. Verify configuration in environment
3. Try rebuilding the index
4. Check application logs for errors`,
      },
    ],
  },
  // --- Logs & Monitoring ---
  {
    slug: "logs-monitoring-audit",
    name: "Audit Logs",
    icon: FileText,
    permission: "audit.view",
    articles: [
      {
        id: "audit-logs",
        title: "Audit Log",
        tags: ["audit", "activity", "tracking", "events", "admin"],
        content: `# Audit Log

Review system activity and track user actions.

## Viewing Audit Logs

1. Go to **Configuration** → **Audit Log**
2. Browse the paginated log entries
3. Use filters to narrow results by user, action, severity, or date range

## What's Logged

The audit log tracks:

- **Authentication** - Logins, logouts, failed attempts
- **User Management** - Account creation, modification, deletion
- **Settings Changes** - System configuration updates
- **Backup Operations** - Backup creation, restoration, deletion
- **Admin Actions** - Manual job runs, data exports

## Filtering & Search

- Filter by **user**, **action type**, **severity**, or **correlation ID**
- Set **date ranges** to focus on specific time periods
- Use the search bar for keyword searches

## Exporting

Click **Export CSV** to download filtered audit log data for external analysis.

## Live Streaming

Enable the **Live** toggle to see new log entries appear in real-time (requires broadcasting to be configured).`,
      },
    ],
  },
  {
    slug: "logs-monitoring-app",
    name: "Application Logs",
    icon: FileText,
    permission: "logs.view",
    articles: [
      {
        id: "application-logs",
        title: "Application Logs",
        tags: ["logs", "console", "viewer", "errors", "debug"],
        content: `# Application Logs

View and export application log output in real-time.

## Log Viewer

1. Go to **Configuration** → **Application Logs**
2. View recent log entries with severity levels
3. Enable **Live** mode to stream new entries in real-time

## Log Levels

- **Debug** - Detailed diagnostic information
- **Info** - General operational events
- **Warning** - Potential issues that should be monitored
- **Error** - Failures that need attention
- **Critical** - Severe errors requiring immediate action

## Exporting Logs

Use the Export card to download log files:

1. Select a date range
2. Optionally filter by log level or correlation ID
3. Choose CSV or JSON Lines format
4. Click **Export**

## Correlation IDs

Each request gets a unique correlation ID. Use it to trace all log entries from a single request across the system.`,
      },
      {
        id: "access-logs",
        title: "Access Logs (HIPAA)",
        tags: ["hipaa", "phi", "access", "compliance", "audit trail"],
        content: `# Access Logs (HIPAA)

Track access to protected health information (PHI) for HIPAA compliance.

## What's Tracked

Access logs record every time sensitive data is accessed:

- **User** who accessed the data
- **Action** performed (view, search, export)
- **Resource type** and ID accessed
- **Fields accessed** (extracted automatically)
- **IP address** and timestamp

## Viewing Access Logs

1. Go to **Configuration** → **Access Logs**
2. Browse the log entries
3. Filter by user, action, resource type, or date range

## Exporting

Click **Export CSV** to download access log data for compliance audits.

## Enabling/Disabling

HIPAA access logging can be toggled in **Configuration** → **Log Retention**. When disabled, you can optionally delete all existing access logs (with a compliance warning).`,
      },
    ],
  },
  {
    slug: "logs-monitoring-settings",
    name: "Log Settings & Jobs",
    icon: Settings,
    permission: "settings.view",
    articles: [
      {
        id: "log-retention",
        title: "Log Retention",
        tags: ["retention", "cleanup", "logs", "hipaa", "storage"],
        content: `# Log Retention

Configure how long different types of logs are kept.

## Retention Settings

1. Go to **Configuration** → **Log Retention**
2. Set retention periods for each log type:
   - **Application Logs** - 1 to 365 days
   - **Audit Logs** - 30 to 730 days
   - **Access Logs** - Minimum 6 years (HIPAA requirement)

## HIPAA Access Logging

Toggle HIPAA access logging on or off. When disabled:

- Access log collection stops
- A **Delete All Access Logs** button becomes available
- A compliance warning is shown before deletion

## Automatic Cleanup

Old logs are automatically cleaned up via the scheduled \`log:cleanup\` command. You can also run cleanup manually from **Configuration** → **Jobs**.`,
      },
      {
        id: "scheduled-jobs",
        title: "Scheduled Jobs",
        tags: ["jobs", "scheduler", "queue", "tasks", "cron"],
        content: `# Scheduled Jobs

Monitor and manually trigger scheduled system tasks.

## Viewing Jobs

1. Go to **Configuration** → **Jobs**
2. The **Scheduled Tasks** tab shows all registered tasks with their schedule and last run time

## Running Jobs Manually

Certain tasks can be triggered manually:

- **backup:run** - Create a backup now
- **log:cleanup** - Clean up old log files
- **log:check-suspicious** - Check for suspicious activity patterns

Click **Run Now** next to a whitelisted command. A confirmation dialog is shown for potentially destructive operations.

## Queue Status

The **Queue Status** tab shows pending and failed job counts. The **Failed Jobs** tab lists failed queue jobs with options to retry or delete them.

## Run History

Each manual run is recorded with its output, duration, and exit status. All manual runs are audited.`,
      },
    ],
  },
  // --- Usage & Costs (usage.view) ---
  {
    slug: "usage-costs",
    name: "Usage & Costs",
    icon: BarChart3,
    permission: "usage.view",
    articles: [
      {
        id: "usage-costs",
        title: "Usage & Costs",
        tags: ["usage", "cost", "analytics", "budget", "billing", "llm", "tokens"],
        content: `# Usage & Costs

Track and visualize costs across all paid integrations.

## Dashboard Overview

1. Go to **Configuration** → **Usage & Costs**
2. Select a date range (7 days, 30 days, 90 days, this month, last month)
3. View summary cards for total cost and per-integration breakdown

## Tracked Integrations

- **LLM** - AI provider API calls (tokens used, estimated cost)
- **Email** - Transactional email delivery
- **SMS** - Text message sending
- **Storage** - Cloud storage operations
- **Broadcasting** - Real-time event broadcasting

## Cost Trends

The stacked area chart shows cost trends over time. Use the integration filter toggles to show/hide specific integration types.

## Provider Breakdown

The sortable table shows per-provider cost and quantity totals with a summary row.

## Budget Alerts

Configure monthly budgets per integration type in settings. When spending approaches or exceeds a budget (default 80% threshold), admin users are notified.

## Export

Click **Export CSV** to download filtered usage data for external analysis.`,
      },
    ],
  },
  // --- Backup & Data (backups.view) ---
  {
    slug: "backup-data",
    name: "Backup & Data",
    icon: Database,
    permission: "backups.view",
    articles: [
      {
        id: "backup-settings",
        title: "Backup Configuration",
        tags: ["backup", "restore", "admin", "data"],
        content: `# Backup Configuration

## Automatic Backups

Configure scheduled backups:

1. Go to **Configuration** → **Backup**
2. Enable automatic backups
3. Set backup frequency
4. Configure retention period

## Manual Backups

Create a backup immediately:

1. Go to **Configuration** → **Backup**
2. Click **Create Backup**
3. Wait for completion
4. Download if needed

## Restoring from Backup

To restore:

1. Select a backup from the list
2. Click **Restore**
3. Confirm the action
4. Wait for the process to complete

**Warning:** Restoring replaces current data!`,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Get all help categories the user has access to based on their permissions.
 * Categories without a `permission` field are visible to all authenticated users.
 * Admin users have all permissions in their permissions array, so they see everything.
 */
export function getAllCategories(permissions: string[]): HelpCategory[] {
  const permissionGated = permissionHelpCategories.filter(
    (cat) => !cat.permission || permissions.includes(cat.permission)
  );
  return [...userHelpCategories, ...permissionGated];
}

/**
 * Find an article by ID across all categories the user can access.
 */
export function findArticle(articleId: string, permissions: string[]): { article: HelpArticle; category: HelpCategory } | null {
  const categories = getAllCategories(permissions);

  for (const category of categories) {
    const article = category.articles.find((a) => a.id === articleId);
    if (article) {
      return { article, category };
    }
  }

  return null;
}

/**
 * Get all articles as searchable items, filtered by user permissions.
 */
export function getSearchableArticles(permissions: string[]) {
  const categories = getAllCategories(permissions);

  return categories.flatMap((category) =>
    category.articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      category: category.name,
      categorySlug: category.slug,
      tags: article.tags,
    }))
  );
}
