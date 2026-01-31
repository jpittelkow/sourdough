# Features

Core functionality and feature documentation:

## User Management & Authentication

- [API Authentication Endpoints](api/README.md#authentication) - Email/password, SSO, 2FA endpoints
- [ADR-002: Authentication Architecture](adr/002-authentication-architecture.md) - Laravel Sanctum session-based auth design
- [ADR-003: SSO Provider Integration](adr/003-sso-provider-integration.md) - OAuth2/OIDC integration (Google, GitHub, Microsoft, Apple, Discord, GitLab)
- [ADR-004: Two-Factor Authentication](adr/004-two-factor-authentication.md) - TOTP + recovery codes implementation

**Capabilities:**
- Email/password authentication with Laravel Sanctum
- SSO via OAuth2/OIDC (Google, GitHub, Microsoft, Apple, Discord, GitLab, Enterprise OIDC); **sign-in and register pages** show "Continue with {provider}" only for providers that have credentials and are **enabled** (from `GET /auth/sso/providers`); **setup** is Configuration > SSO (`/configuration/sso`) with per-provider enabled toggle, setup modals, and test connection
- Two-factor authentication (TOTP + recovery codes)
- Password reset and email verification
- **Configurable auth features (Configuration > Security):** Admins can set **email verification** (disabled / optional / required), **self-service password reset** (on/off), and **2FA** (disabled / optional / required). When email verification is required, unverified users get 403 on protected routes. When 2FA is required, users without 2FA are redirected to Configuration > Security to set up 2FA. When password reset is disabled, the "Forgot password?" link and forgot-password page are hidden; backend returns 503 for forgot-password requests.
- **Auth UI:** Sign-in and register use a glassmorphism card layout, password visibility toggle, password strength indicator (register/reset), and real-time email availability check on register (`POST /auth/check-email`)
- **Admin user management**: Configuration > Users – list users (pagination, search), create/edit/disable users, role (admin) management, send verification email on creation, resend verification email, reset password. Disabled users cannot log in.
- **User groups & permissions:** Role-based access via user groups and a permission enum. Admin status is solely via the **admin** group (no `is_admin` column); the first registered user is assigned to the admin group. **Permission model:** Permissions (e.g. `users.view`, `settings.edit`, `backups.create`) are defined in `Permission` enum; Laravel Gates are auto-registered so routes use `can:permission.name`. Admin group users have all permissions implicitly. Auth response (`GET /auth/user`) includes computed `permissions` array for the frontend. **Backend:** `user_groups`, `user_group_members`, `group_permissions` tables; default groups (Administrators, Users); `HasGroups` trait; `GroupService`, `PermissionService` (cached checks); API for groups, members, permissions; `PUT /api/users/{user}/groups`. All admin/config routes are protected by granular permissions (users, groups, settings, backups, logs, audit). **Frontend:** `usePermission(permission)` and `<PermissionGate>` for conditional UI; Configuration layout shows nav items only when the user has the required permission; access to Configuration requires at least one config-related permission or admin. **Admin UI:** Configuration > Groups – list, create/edit/delete groups, manage members, permission matrix; Configuration > Users – groups column, group assignment (`UserGroupPicker`), filter by group; User profile shows group memberships. See [Recipe: Add a new permission](ai/recipes/add-new-permission.md), [Recipe: Create a custom group](ai/recipes/create-custom-group.md), [User Groups Roadmap](plans/user-groups-roadmap.md).
- All features optional for self-hosted deployments

## Dashboard & Widgets

- [Recipe: Add Dashboard Widget](ai/recipes/add-dashboard-widget.md) - Create new static widgets for the dashboard
- [Patterns: Dashboard Widget](ai/patterns.md#dashboard-widget-pattern) - Widget component structure and patterns

**Static dashboard** at `/dashboard`: Developer-defined widgets in a responsive grid layout. No user configuration—widgets are added in code.

**Available widgets:**
- **Welcome** – Greeting with user name (static)
- **System Stats** – Total users and storage used (data from `GET /api/dashboard/stats`)
- **Quick Actions** – Links to Audit Logs, Users, System Settings

**Capabilities:**
- **Widget components:** Self-contained React components in `frontend/components/dashboard/widgets/` with loading/error states; data-fetching via React Query
- **Permission-based visibility:** Use `usePermission()` to conditionally render widgets (e.g., admin-only)
- **Simple API:** `DashboardController::stats()` returns metrics for the stats widget

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
- Auth settings: Configuration > Security (`/configuration/security`); **Authentication (system-wide)** card: email verification mode (disabled/optional/required), self-service password reset toggle, two-factor mode (disabled/optional/required). Stored in `auth` group in settings schema; public features exposed via `GET /system-settings/public` for login/forgot-password UI.
- SSO settings: Configuration > SSO (`/configuration/sso`); OAuth client IDs and secrets for Google, GitHub, Microsoft, Apple, Discord, GitLab, and OIDC; per-provider **enabled** toggle and **per-provider save** (global options card has its own save); setup instruction modals and copyable redirect URIs; test connection per provider

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

## Search (Full-Text)

- [Meilisearch Integration Roadmap](plans/meilisearch-integration-roadmap.md) - Phases 1–6 (Docker, Scout, User searchable, API, frontend, admin)
- [Recipe: Add searchable model](ai/recipes/add-searchable-model.md) - Add new models to search
- [Patterns: SearchService](ai/patterns.md#searchservice-pattern) - Backend search API and indexing

**Capabilities:**
- **Global search (Cmd+K / Ctrl+K):** Command-palette style modal from header; debounced input, results grouped by type with icons, keyboard navigation, recent searches in localStorage, highlight of matched text. Stale response handling so only the latest query’s results are shown.
- **Static page search:** Cmd+K searches both **pages** (navigation) and **database records**. Pages (Dashboard, Notifications, User Preferences, Configuration sections) appear instantly; database results (users, notifications, email templates, etc.) appear after the API response. Admin-only Configuration pages are shown only to admins.
- **Search API:** `GET /api/search` (q, type, page, per_page) and `GET /api/search/suggestions` (q, limit). Admin sees all users; non-admin results scoped to current user. Both routes use `log.access:User` (access logged when returning user data).
- **Admin:** Configuration > Search – index statistics (document counts per model), Reindex per model or Reindex all. Reindex also via `php artisan search:reindex` or `search:reindex {model}`.
- **Backend:** Laravel Scout with Meilisearch driver; SearchService with globalSearch(), getSuggestions(), getIndexStats(), reindexAll()/reindexModel(). Fallback to database LIKE when Meilisearch unavailable. Result text escaped for XSS safety when rendered with highlights.
- **Extensibility:** Add new searchable models via Searchable trait, SearchReindexCommand, SearchService type branch and transform (with XSS-safe escaping), and frontend result icon. See recipe.

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

## Notification Templates

- [ADR-017: Notification Template System](adr/017-notification-template-system.md) - Per-type templates for push, in-app, and chat
- [Recipe: Add Notification Template](ai/recipes/add-notification-template.md) - Add new notification types
- [Recipe: Keep Notification Template Variables Up to Date](ai/recipes/keep-notification-template-variables-up-to-date.md) - Update variable descriptions when adding or changing template variables

**Capabilities:**
- Admin UI: Configuration > Notification Templates (`/configuration/notification-templates`) – list by type and channel group, edit title and body, **Available Variables** reference panel (collapsible, with descriptions and copy), live preview, reset to default (system templates)
- Per-notification-type templates for channel groups: **push** (WebPush, FCM, ntfy), **inapp** (DatabaseChannel), **chat** (Telegram, Discord, Slack, Twilio, Signal, Matrix, Vonage, SNS)
- Variable replacement with `{{variable}}` and `{{user.name}}` (dot notation)
- Template preview with sample or provided variables (supports unsaved content for live preview)
- Reset to default content for system templates
- Default types: backup.completed, backup.failed, auth.login, auth.password_reset, system.update, llm.quota_warning (each with push, inapp, chat templates)
- **Orchestrator:** `sendByType($user, $type, $variables, $channels)` uses templates per channel; existing `send()` unchanged; each channel optionally resolves a template for (type, channel_group) when present

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
- **Configuration > Access Logs (HIPAA)** (`/configuration/access-logs`): PHI access audit trail. Table shows date, user, action, resource type, resource ID, IP, and **fields accessed** (extracted automatically by middleware). Filters (user, action, resource type, correlation ID, dates), CSV export. AccessLogService + LogResourceAccess middleware on profile, user, user-settings, and search/suggestions (when returning user data) routes. Admin only.
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

## Storage Settings

- [Storage Settings Enhancement Roadmap](plans/storage-settings-roadmap.md) – Phases 1–2 done; Phases 3–4 (file manager, analytics) planned

**Capabilities (Phase 1 – Local Storage Transparency):**
- **Configuration > Storage** (`/configuration/storage`): Storage driver selection, max upload size, allowed file types. Stored in DB with env fallback (`manage-settings`).
- **Storage paths**: UI shows where files are stored (app, public, backups, cache, sessions, logs) with path and description; `GET /storage-settings/paths`.
- **Storage health**: Warning alert when storage is not writable or disk usage ≥ 90%; free/total space and usage percent; `GET /storage-settings/health`.
- **Usage breakdown**: Statistics card shows total size, file count, driver, and per-directory usage (local driver only); `GET /storage-settings/stats` includes `breakdown` by directory.

**Capabilities (Phase 2 – Additional Providers):**
- **Supported drivers**: Local, Amazon S3, Google Cloud Storage (GCS), Azure Blob Storage, DigitalOcean Spaces, MinIO, Backblaze B2.
- **Provider-specific forms**: Dynamic fields per driver (bucket, region, credentials, endpoint where applicable). GCS uses service account JSON; Azure uses connection string and container; S3-compatible (DO Spaces, MinIO, B2) use key/secret and optional custom endpoint.
- **Connection test**: "Test Connection" button (non-local drivers) calls `POST /storage-settings/test` and shows success or error message.

## Scheduled Jobs

**Configuration > Jobs** (`/configuration/jobs`) – Monitor and run scheduled tasks. Admin only.

**Capabilities:**
- **Scheduled Tasks tab**: List of tasks from Laravel scheduler (and triggerable-only commands like log:cleanup). Columns: command, schedule, last run, description. **Run Now** for whitelisted commands (backup:run, log:cleanup, log:check-suspicious); confirmation dialog with extra warning for destructive commands; output and duration shown after run. Run history stored in `task_runs` table.
- **Queue Status tab**: Pending and failed job counts; queue breakdown when available.
- **Failed Jobs tab**: List failed queue jobs with retry, delete, retry all, clear all.
- **API**: `GET /api/jobs/scheduled` (tasks with triggerable, last_run, dangerous); `POST /api/jobs/run/{command}` (body: optional `{ options: {} }`); existing queue/failed endpoints. Manual runs are audited (`scheduled_command_run`).
