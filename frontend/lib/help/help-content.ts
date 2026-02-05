import { type LucideIcon, Book, Shield, Bell, Settings, User, Search } from "lucide-react";

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
  adminOnly?: boolean;
}

// User-facing help categories
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

// Admin-only help categories
export const adminHelpCategories: HelpCategory[] = [
  {
    slug: "admin-settings",
    name: "Admin Settings",
    icon: Settings,
    adminOnly: true,
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
  {
    slug: "admin-search",
    name: "Search Administration",
    icon: Search,
    adminOnly: true,
    articles: [
      {
        id: "search-config",
        title: "Search Configuration",
        tags: ["search", "meilisearch", "indexing", "admin"],
        content: `# Search Configuration

## How Search Works

The application uses Meilisearch for fast, typo-tolerant search.

## Reindexing

If search results seem outdated:

1. Go to **Configuration** → **System**
2. Find the search section
3. Click **Rebuild Search Index**
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
];

// Combine all categories
export function getAllCategories(isAdmin: boolean): HelpCategory[] {
  if (isAdmin) {
    return [...userHelpCategories, ...adminHelpCategories];
  }
  return userHelpCategories;
}

// Find an article by ID
export function findArticle(articleId: string, isAdmin: boolean): { article: HelpArticle; category: HelpCategory } | null {
  const categories = getAllCategories(isAdmin);
  
  for (const category of categories) {
    const article = category.articles.find((a) => a.id === articleId);
    if (article) {
      return { article, category };
    }
  }
  
  return null;
}

// Get all articles as searchable items
export function getSearchableArticles(isAdmin: boolean) {
  const categories = getAllCategories(isAdmin);
  
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
