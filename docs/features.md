# Features

Core functionality and feature documentation:

## User Management & Authentication

- [API Authentication Endpoints](api/README.md#authentication) - Email/password, SSO, 2FA endpoints
- [ADR-002: Authentication Architecture](adr/002-authentication-architecture.md) - Laravel Sanctum session-based auth design
- [ADR-003: SSO Provider Integration](adr/003-sso-provider-integration.md) - OAuth2/OIDC integration (Google, GitHub, Microsoft, Apple, Discord, GitLab)
- [ADR-004: Two-Factor Authentication](adr/004-two-factor-authentication.md) - TOTP + recovery codes implementation

**Capabilities:**
- Email/password authentication with Laravel Sanctum
- SSO via OAuth2/OIDC (Google, GitHub, Microsoft, Apple, Discord, GitLab)
- Two-factor authentication (TOTP + recovery codes)
- Password reset and email verification
- All features optional for self-hosted deployments

## Notification System

- [ADR-005: Notification System Architecture](adr/005-notification-system-architecture.md) - Multi-channel notification delivery system
- [API Notification Endpoints](api/README.md#notifications) - Notification management API
- [Recipe: Trigger Notifications](ai/recipes/trigger-notifications.md) - Send notifications from backend code

**Capabilities:**
- In-app notification UI: header bell with unread badge, dropdown of recent items, full `/notifications` page with filters and bulk actions
- Real-time updates via Laravel Echo + Pusher when broadcasting is configured
- NotificationContext provider for client-side state
- **Global vs per-user config:** Admins enable which channels are available in Configuration > Notifications (`/configuration/notifications`); users enable channels, add webhooks/phone, test, and accept usage in User Preferences (`/user/preferences`). Users cannot enable a channel until an admin has made it available. SMS: admin chooses preferred provider (Twilio/Vonage/SNS); users enter phone number and test.

**Multi-channel notification delivery:**

| Channel | Provider | Status |
|---------|----------|--------|
| Email | SMTP, Mailgun, SendGrid, SES, Postmark | ✅ |
| Telegram | Bot API | ✅ |
| Discord | Webhooks | ✅ |
| Slack | Webhooks | ✅ |
| SMS | Twilio, Vonage | ✅ |
| Signal | signal-cli | 🔄 |
| Push | Web Push, FCM | 🔄 |
| In-App | Database + WebSocket | ✅ |

## AI/LLM Orchestration

- [ADR-006: LLM Orchestration Modes](adr/006-llm-orchestration-modes.md) - Single, Aggregation, and Council modes
- [API LLM Endpoints](api/README.md#llmai) - Query endpoints for text and vision

**Multi-provider LLM support with three operating modes:**

1. **Single Mode** - Direct query to one provider
2. **Aggregation Mode** - Query all, primary synthesizes
3. **Council Mode** - All providers vote, consensus resolution

**Supported providers:**
- Claude (Anthropic)
- OpenAI (GPT-4, GPT-4o)
- Gemini (Google)
- Ollama (local/self-hosted)
- AWS Bedrock
- Azure OpenAI

## Configuration Management

- [ADR-014: Database Settings with Environment Fallback](adr/014-database-settings-env-fallback.md) - Database-stored settings with env fallback
- Mail settings: Configuration > Email (`/configuration/email`); SMTP and provider credentials stored in DB with encryption for secrets
- SSO settings: Configuration > SSO (`/configuration/sso`); OAuth client IDs and secrets for Google, GitHub, Microsoft, Apple, Discord, GitLab, and OIDC

**Capabilities:**
- System-wide settings stored in `system_settings` with environment fallback (no restart for changes)
- SettingService with file-based caching; ConfigServiceProvider injects settings into Laravel config at boot
- Mail configuration (provider, SMTP, from address) editable via admin UI; sensitive values encrypted at rest
- SSO configuration (global options and per-provider credentials) editable via admin UI; client secrets encrypted at rest
- Artisan command `php artisan settings:import-env` to import current env values into the database
- Reset-to-default per setting (revert to env value)

## Backup & Restore

**Documentation hub:** [Backup & Restore](backup.md) – user guide, admin settings, developer docs, key files, and how to extend.

- [ADR-007: Backup System Design](adr/007-backup-system-design.md) – ZIP-based backup with manifest, destinations, security
- [ADR-014](adr/014-database-settings-env-fallback.md) / [ADR-015](adr/015-env-only-settings.md) – Backup settings in DB with env fallback; env-only settings
- [API: Backup operations](api/README.md#backup--restore-admin) – List, create, download, restore, delete
- [API: Backup settings](api/README.md#backup-settings-admin) – Get/update settings, reset key, test destination
- [Recipe: Add backup destination](ai/recipes/add-backup-destination.md) – Add a new storage destination
- [Recipe: Extend backup/restore](ai/recipes/extend-backup-restore.md) – New settings, restore behavior, scheduling, notifications
- [Patterns: Backup & Restore](ai/patterns.md#backup--restore-patterns) – Settings flow, destination interface, UI structure

**Capabilities:**
- ZIP-based backup format with manifest (version 2.0)
- Database backup (SQLite copy or export; MySQL/PostgreSQL export)
- File backup (uploaded files under `storage/app/public`)
- Settings backup (database-stored settings; sensitive values handled securely)
- Scheduled backups (daily/weekly/monthly; configurable time and destinations)
- Remote destinations: local disk, S3, SFTP, Google Drive (pluggable via `DestinationInterface`)
- **Backup settings UI**: Configuration > Backup – **Backups** tab (create, download, restore, delete); **Settings** tab (retention, schedule, S3/SFTP/Google Drive credentials, encryption, notifications). All backup configuration stored in DB with env fallback; Test Connection for each remote destination.
