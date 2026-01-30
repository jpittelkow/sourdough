# Features

Core functionality and feature documentation:

## User Management & Authentication

- [API Authentication Endpoints](api/README.md#authentication) - Email/password, SSO, 2FA endpoints
- [ADR-002: Authentication Architecture](adr/002-authentication-architecture.md) - Laravel Sanctum session-based auth design
- [ADR-003: SSO Provider Integration](adr/003-sso-provider-integration.md) - OAuth2/OIDC integration (Google, GitHub, Microsoft, Apple, Discord, GitLab)
- [ADR-004: Two-Factor Authentication](adr/004-two-factor-authentication.md) - TOTP + recovery codes implementation

**Capabilities:**
- Email/password authentication with Laravel Sanctum
- SSO via OAuth2/OIDC (Google, GitHub, Microsoft, Apple, Discord, GitLab, Enterprise OIDC); **sign-in and register pages** show "Continue with {provider}" buttons for each enabled provider (from `GET /auth/sso/providers`); **setup** is Configuration > SSO (`/configuration/sso`)
- Two-factor authentication (TOTP + recovery codes)
- Password reset and email verification
- **Auth UI:** Sign-in and register use a glassmorphism card layout, password visibility toggle, password strength indicator (register/reset), and real-time email availability check on register (`POST /auth/check-email`)
- **Admin user management**: Configuration > Users – list users (pagination, search), create/edit/disable users, role (admin) management, send verification email on creation, resend verification email, reset password. Disabled users cannot log in.
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

**LLM model discovery:** When adding a provider in Configuration > AI, enter your API key (or Ollama host), click **Test** to validate credentials, then **Fetch Models** to load available models from the provider API. Model list is cached server-side for 1 hour. OpenAI, Claude, Gemini, and Ollama are supported for discovery; Azure and Bedrock deferred.

## Configuration Management

- [ADR-014: Database Settings with Environment Fallback](adr/014-database-settings-env-fallback.md) - Database-stored settings with env fallback
- Mail settings: Configuration > Email (`/configuration/email`); SMTP and provider credentials stored in DB with encryption for secrets
- SSO settings: Configuration > SSO (`/configuration/sso`); OAuth client IDs and secrets for Google, GitHub, Microsoft, Apple, Discord, GitLab, and OIDC

**Configuration navigation:** Admin configuration uses grouped, collapsible navigation (General, Users & Access, Communications, Integrations, Logs & Monitoring, Data). Groups expand/collapse; the group containing the current page is expanded by default. Expanded state persists in localStorage. Same structure on desktop sidebar and mobile drawer. See [Recipe: Add configuration menu item](ai/recipes/add-configuration-menu-item.md) and [Patterns: Configuration Navigation](ai/patterns.md#configuration-navigation-pattern).

**Collapsible settings sections:** Configuration pages (SSO, Notifications, AI/LLM, Backup) use the shared `CollapsibleCard` component so provider/channel sections can be expanded or collapsed. Headers show icon, name, and status badge; content (forms, toggles) is in the expandable body. See [Patterns: CollapsibleCard](ai/patterns.md#collapsiblecard-pattern) and [Recipe: Add collapsible section](ai/recipes/add-collapsible-section.md).

**Provider icons:** A shared `ProviderIcon` component (`frontend/components/provider-icons.tsx`) provides branded or monochrome icons for SSO providers, LLM providers, notification channels, email/backup providers. Used on sign-in buttons (branded) and in configuration CollapsibleCard headers (mono).

**Capabilities:**
- System-wide settings stored in `system_settings` with environment fallback (no restart for changes)
- SettingService with file-based caching; ConfigServiceProvider injects settings into Laravel config at boot
- Mail configuration (provider, SMTP, from address) editable via admin UI; sensitive values encrypted at rest
- SSO configuration (global options and per-provider credentials) editable via admin UI; client secrets encrypted at rest
- Artisan command `php artisan settings:import-env` to import current env values into the database
- Reset-to-default per setting (revert to env value)

## Email Templates

- [ADR-016: Email Template System](adr/016-email-template-system.md) - Database-stored customizable email templates
- [Recipe: Add Email Template](ai/recipes/add-email-template.md) - Add new templates

**Capabilities:**
- Admin UI: Configuration > Email Templates (`/configuration/email-templates`) – list templates, edit with TipTap WYSIWYG editor, variable picker, live preview, send test email, reset to default (system templates)
- Admin-editable email templates (subject, HTML body, plain text) via API
- Variable replacement with `{{variable}}` and `{{user.name}}` (dot notation)
- Template preview with sample or provided variables (supports unsaved content for live preview)
- Test email sending (requires email configured)
- Reset to default content for system templates
- Default templates: password reset, email verification, welcome, generic notification
- **Integration (Chunk D):** Password reset, email verification, and notification emails are sent using these templates (TemplatedMail Mailable; User overrides and EmailChannel use EmailTemplateService).

## Audit Logs

- [Audit Logs Roadmap](plans/audit-logs-roadmap.md) – UI/UX, dashboard analytics, logging improvements
- [Audit Logging Implementation](journal/2026-01-29-audit-logging-implementation.md) – Phase 1–4 (AuditService, integrations, frontend, docs)
- [Audit Dashboard Analytics](journal/2026-01-29-audit-dashboard-analytics.md) – Phase 2 dashboard widget
- [Audit Extended Features](journal/2026-01-29-audit-extended-features.md) – Real-time streaming, structured JSON logging
- [Console and Application Logging](journal/2026-01-29-console-app-logging.md) – Backend logging audit, log levels/rotation, frontend error reporting
- [Recipe: Trigger audit logging](ai/recipes/trigger-audit-logging.md) – Log from controllers/services
- [Recipe: Add auditable action](ai/recipes/add-auditable-action.md) – Add new audited actions
- [Recipe: Extend logging](ai/recipes/extend-logging.md) – Add logging to backend/frontend, new log channels
- [Recipe: Add access logging](ai/recipes/add-access-logging.md) – HIPAA access logging for PHI
- [Logging](logging.md) – Logging standards, configuration, frontend errorLogger
- [Logging Roadmap](plans/logging-roadmap.md) – Retention, cleanup, app log export (done); optional external storage

**Capabilities:**
- **Configuration > Audit** (`/configuration/audit`): Paginated audit log with filters (user, action, severity, correlation ID, date range), search, severity badges, detail modal (old/new values, IP, user agent), CSV export. Admin only.
- **Configuration > Application Logs** (`/configuration/logs`): Real-time console log viewer and export. Enable "Live" to stream `Log::` output via private `app-logs` channel (requires `LOG_BROADCAST_ENABLED=true`, `broadcast` in `LOG_STACK`, Pusher). Export card: export log files by date range, level, correlation ID as CSV or JSON Lines (`GET /api/app-logs/export`). Admin only.
- **Configuration > Access Logs (HIPAA)** (`/configuration/access-logs`): PHI access audit trail. Table shows date, user, action, resource type, resource ID, IP, and **fields accessed** (extracted automatically by middleware). Filters (user, action, resource type, correlation ID, dates), CSV export. AccessLogService + LogResourceAccess middleware on profile, user, and user-settings routes. Admin only.
- **Configuration > Log retention** (`/configuration/log-retention`): Configure retention days for application logs (1–365), audit logs (30–730), access logs (6 years minimum for HIPAA). Toggle **HIPAA access logging** (enable/disable). When disabled, “Delete all access logs” is available (with HIPAA violation warning). Cleanup via `php artisan log:cleanup` (optional `--dry-run`, `--archive`). Admin only.
- **Live streaming (audit)**: "Live" toggle on audit page streams new logs in real time via private `audit-logs` channel (Pusher); connection status and highlight animation for new entries. Requires BROADCAST_CONNECTION=pusher and admin user.
- **Dashboard analytics** (admin dashboard): “System Activity” widget with stats cards (total actions, warnings/errors), severity donut chart, activity trends area chart (last 30 days), recent warnings list, and “View all logs” link.
- **Stats API** (`GET /audit-logs/stats`): `total_actions`, `by_severity`, `daily_trends`, `recent_warnings`, `actions_by_type`, `actions_by_user`. Query params: `date_from`, `date_to`.
- **Suspicious activity**: Banner on admin dashboard when 5+ failed logins in 15 min or 10+ export actions in 1 hour; `GET /api/suspicious-activity`. Scheduled `log:check-suspicious` notifies admins (in-app + email).
- AuditService + AuditLogging trait; auth, user management, settings, and backup actions logged. Action naming `{resource}.{action}`; severity info/warning/error/critical; sensitive data masked.

**Structured application logging:**
- **Correlation ID**: Middleware adds `X-Correlation-ID` to requests (or uses client-provided header) and response for tracing.
- **JSON logging**: Optional `json` channel writes structured JSON to stderr (correlation_id, user_id, ip_address, request_uri). Set `LOG_STACK=single,json` in `.env`.
- **Log levels and rotation**: `LOG_LEVEL` (debug/info/warning) and `LOG_DAILY_DAYS` (default 14) in `.env`; daily channel has context tap.
- **Frontend error reporting**: `errorLogger` (`frontend/lib/error-logger.ts`) reports to `POST /api/client-errors`; ErrorBoundary and global handlers report uncaught errors. Use `errorLogger.report()` / `errorLogger.captureMessage()` instead of `console.error`/`console.warn`.

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

## Scheduled Jobs

**Configuration > Jobs** (`/configuration/jobs`) – Monitor and run scheduled tasks. Admin only.

**Capabilities:**
- **Scheduled Tasks tab**: List of tasks from Laravel scheduler (and triggerable-only commands like log:cleanup). Columns: command, schedule, last run, description. **Run Now** for whitelisted commands (backup:run, log:cleanup, log:check-suspicious); confirmation dialog with extra warning for destructive commands; output and duration shown after run. Run history stored in `task_runs` table.
- **Queue Status tab**: Pending and failed job counts; queue breakdown when available.
- **Failed Jobs tab**: List failed queue jobs with retry, delete, retry all, clear all.
- **API**: `GET /api/jobs/scheduled` (tasks with triggerable, last_run, dangerous); `POST /api/jobs/run/{command}` (body: optional `{ options: {} }`); existing queue/failed endpoints. Manual runs are audited (`scheduled_command_run`).
