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

## Backup & Restore

- [ADR-007: Backup System Design](adr/007-backup-system-design.md) - ZIP-based backup with manifest, scheduled automation
- [API Backup Endpoints](api/README.md#backup--restore-admin) - Admin backup management

**Capabilities:**
- ZIP-based backup format with manifest
- Database backup (SQLite copy, MySQL/PG dump)
- File backup (all uploaded files)
- Configuration backup (encrypted settings)
- Scheduled automatic backups
- Remote backup destinations (S3, SFTP)
