# Context Loading Guide

Which files to read first based on your task type.

## Before Any Implementation

**CRITICAL: Check for existing components first!**

Before writing any code, search the codebase:

1. **Search `frontend/components/`** - Does a similar component exist?
2. **Search `frontend/lib/`** - Is there a utility for this task?
3. **Search existing pages** - How is this solved elsewhere?

**Never duplicate logic across pages.** If functionality exists, use it. If it should exist, create it as a global component.

See: [Cursor rule: global-components.mdc](../../.cursor/rules/global-components.mdc)

## Frontend UI Work

**Read first:**
```
frontend/app/(dashboard)/           # Existing page patterns
frontend/components/ui/             # shadcn components (CLI-managed; frontend/components.json)
frontend/components/ui/collapsible-card.tsx  # Collapsible sections (settings, config)
frontend/components/provider-icons.tsx       # Provider/channel icons (SSO, LLM, etc.)
frontend/components/                # App-specific components
frontend/config/app.ts              # App configuration (branding, etc.)
frontend/lib/api.ts                 # API call patterns
frontend/lib/utils.ts               # Utility functions
```

**Also useful:**
```
frontend/app/(dashboard)/layout.tsx # Dashboard layout structure
frontend/components/sidebar.tsx     # Navigation structure
frontend/components/header.tsx      # Header components
frontend/components/logo.tsx        # Logo component with variants
```

## Backend API Work

**Read first:**
```
backend/routes/api.php                          # Existing routes
backend/app/Http/Controllers/Api/               # Controller patterns
backend/app/Http/Requests/                      # Validation patterns
backend/app/Http/Resources/                     # Response formatting
backend/app/Http/Traits/                        # Shared controller traits
  AdminAuthorizationTrait.php                   # Last admin protection
  ApiResponseTrait.php                          # Standardized responses
```

**Also useful:**
```
backend/app/Models/                             # Data models
backend/database/migrations/                    # Database schema
```

**Recipes:**
- [Add API endpoint](recipes/add-api-endpoint.md)
- [Add admin-protected action](recipes/add-admin-protected-action.md)

## Notifications Work

**Read first:**
```
docs/adr/005-notification-system-architecture.md
backend/app/Services/Notifications/NotificationOrchestrator.php
backend/app/Services/Notifications/NotificationChannelMetadata.php  # Shared trait
backend/app/Services/Notifications/Channels/    # Existing channels
backend/config/notifications.php
```

**Also useful:**
```
backend/app/Http/Controllers/Api/NotificationController.php
backend/app/Http/Controllers/Api/NotificationChannelConfigController.php  # Admin API
backend/app/Http/Controllers/Api/UserNotificationSettingsController.php   # User API
backend/app/Models/Notification.php
frontend/app/(dashboard)/configuration/notifications/page.tsx  # Admin UI
frontend/app/(dashboard)/user/preferences/page.tsx             # User UI
```

**Recipes:**
- [Trigger Notifications](recipes/trigger-notifications.md)
- [Add Notification Channel](recipes/add-notification-channel.md)

## LLM Work

**Read first:**
```
docs/adr/006-llm-orchestration-modes.md
backend/app/Services/LLM/LLMOrchestrator.php
backend/app/Services/LLM/Providers/             # Existing providers
backend/config/llm.php
```

**Also useful:**
```
backend/app/Http/Controllers/Api/LLMController.php
```

## Settings/Configuration Work

**Read first:**
```
docs/adr/012-admin-only-settings.md
docs/adr/014-database-settings-env-fallback.md  # Database settings with env fallback
backend/app/Services/SettingService.php         # Core settings service
backend/config/settings-schema.php              # Migratable settings definition
backend/app/Providers/ConfigServiceProvider.php # Boot-time config injection
frontend/app/(dashboard)/configuration/         # Configuration pages
backend/app/Http/Controllers/Api/SettingController.php
backend/app/Http/Controllers/Api/MailSettingController.php
backend/app/Http/Controllers/Api/SSOSettingController.php
```

**Also useful:**
```
backend/app/Models/Setting.php
backend/app/Models/SystemSetting.php
docs/plans/env-to-database-roadmap.md
```

**Adding a configuration page or menu item:**
- [frontend/app/(dashboard)/configuration/layout.tsx](frontend/app/(dashboard)/configuration/layout.tsx) – `navigationGroups` and grouped nav
- [Recipe: Add configuration menu item](recipes/add-configuration-menu-item.md)
- [Recipe: Add configuration page](recipes/add-config-page.md) – Form and page structure

## Email Template Work

**Read first:**
```
docs/adr/016-email-template-system.md
backend/app/Models/EmailTemplate.php
backend/app/Services/EmailTemplateService.php
backend/database/seeders/EmailTemplateSeeder.php
```

**Also useful (backend):**
```
backend/app/Http/Controllers/Api/EmailTemplateController.php
backend/routes/api.php
backend/app/Services/RenderedEmail.php
backend/app/Mail/TemplatedMail.php
backend/app/Models/User.php (sendPasswordResetNotification, sendEmailVerificationNotification)
backend/app/Services/Notifications/Channels/EmailChannel.php
```

**Frontend (Admin UI):**
```
frontend/app/(dashboard)/configuration/email-templates/page.tsx
frontend/app/(dashboard)/configuration/email-templates/[key]/page.tsx
frontend/components/email-template-editor.tsx
frontend/components/variable-picker.tsx
frontend/app/(dashboard)/configuration/layout.tsx
```

**Recipes:**
- [Add Email Template](recipes/add-email-template.md)

## Authentication Work

**Read first:**
```
docs/adr/002-authentication-architecture.md
docs/adr/003-sso-provider-integration.md
docs/adr/004-two-factor-authentication.md
backend/app/Http/Controllers/Api/AuthController.php
frontend/lib/auth.ts
```

**Also useful:**
```
backend/app/Services/Auth/AuthService.php
backend/app/Services/Auth/SSOService.php
backend/app/Services/Auth/TwoFactorService.php
frontend/app/(auth)/                            # Auth pages
frontend/components/auth/                       # Auth components
  - auth-page-layout.tsx                        # Layout wrapper
  - auth-divider.tsx                            # SSO/email divider
  - auth-state-card.tsx                         # Success/error states
frontend/components/ui/
  - form-field.tsx                              # Label + Input + error
  - loading-button.tsx                           # Button with spinner
```

## User Management Work

**Read first:**
```
docs/adr/002-authentication-architecture.md
backend/app/Http/Controllers/Api/UserController.php
backend/app/Models/User.php
frontend/app/(dashboard)/configuration/users/page.tsx
frontend/components/admin/user-table.tsx
frontend/components/admin/user-dialog.tsx
```

**Also useful:**
```
backend/routes/api.php                          # users routes (can:admin)
backend/app/Http/Traits/AdminAuthorizationTrait.php
```

## Backup System Work

**Read first:**
```
docs/adr/007-backup-system-design.md
backend/app/Services/Backup/BackupService.php
backend/app/Services/Backup/Destinations/         # Existing destinations (DestinationInterface)
backend/config/settings-schema.php              # backup group (flat keys)
backend/app/Providers/ConfigServiceProvider.php # injectBackupConfig()
```

**Also useful:**
```
backend/app/Http/Controllers/Api/BackupController.php       # List, create, download, restore, delete
backend/app/Http/Controllers/Api/BackupSettingController.php # Settings API + Test Connection
backend/config/backup.php
frontend/app/(dashboard)/configuration/backup/page.tsx       # Backups tab + Settings tab
```

**Recipes:**
- [Add backup destination](recipes/add-backup-destination.md)
- [Extend backup and restore features](recipes/extend-backup-restore.md)

## Audit Logging Work

**Read first:**
```
docs/ai/patterns.md                    # AuditService Pattern section
backend/app/Services/AuditService.php  # Core audit service
backend/app/Http/Traits/AuditLogging.php
backend/app/Models/AuditLog.php
backend/app/Http/Controllers/Api/AuditLogController.php
```

**Also useful:**
```
backend/routes/api.php                 # audit-logs routes (admin)
frontend/app/(dashboard)/configuration/audit/page.tsx  # Audit log UI
frontend/app/(dashboard)/dashboard/page.tsx            # Dashboard (audit widget for admins)
frontend/components/audit/audit-dashboard-widget.tsx   # Audit summary widget
frontend/components/audit/audit-stats-card.tsx         # Stat card component
frontend/components/audit/audit-severity-chart.tsx     # Severity donut chart
frontend/components/audit/audit-trends-chart.tsx       # Activity trends area chart
frontend/components/ui/chart.tsx                       # shadcn chart (Recharts)
backend/database/migrations/           # audit_logs table, severity column
```

**Stats API** (`GET /audit-logs/stats`): Returns `total_actions`, `by_severity`, `daily_trends` (date→count), `recent_warnings` (latest 5 warning/error/critical), `actions_by_type`, `actions_by_user`. Query params: `date_from`, `date_to` (default last 30 days). Index/export support filter by `correlation_id`.

**Recipes:**
- [Trigger audit logging](recipes/trigger-audit-logging.md)
- [Add auditable action](recipes/add-auditable-action.md)
- [Add dashboard widget](recipes/add-dashboard-widget.md) – for dashboard analytics widgets (see audit widget as example)

## HIPAA / Access Logging Work

**Read first:**
```
backend/app/Services/AccessLogService.php
backend/app/Http/Middleware/LogResourceAccess.php
backend/app/Models/AccessLog.php
docs/ai/recipes/add-access-logging.md
```

**Also useful:**
```
backend/routes/api.php  # log.access middleware, access-logs routes, DELETE /access-logs when disabled
frontend/app/(dashboard)/configuration/access-logs/page.tsx  # Access logs UI
frontend/app/(dashboard)/configuration/log-retention/page.tsx  # HIPAA toggle, delete-all when disabled
backend/app/Http/Controllers/Api/AccessLogController.php
```

**Recipes:**
- [Add access logging](recipes/add-access-logging.md)

## Application Logging Work

**Read first:**
```
docs/logging.md
backend/config/logging.php
backend/app/Logging/ContextProcessor.php
backend/app/Http/Middleware/AddCorrelationId.php
frontend/lib/error-logger.ts
frontend/components/error-boundary.tsx
frontend/components/error-handler-setup.tsx
```

**Also useful:**
```
backend/app/Http/Controllers/Api/ClientErrorController.php
backend/app/Services/AppLogExportService.php      # App log file export (date/level/correlation_id)
backend/app/Http/Controllers/Api/AppLogExportController.php  # GET /api/app-logs/export
backend/app/Http/Controllers/Api/LogRetentionController.php  # Log retention settings (group logging)
backend/app/Console/Commands/LogCleanupCommand.php           # log:cleanup (--dry-run, --archive)
backend/app/Services/SuspiciousActivityService.php           # Suspicious pattern detection
backend/app/Console/Commands/CheckSuspiciousActivityCommand.php  # log:check-suspicious
backend/routes/api.php  # client-errors, app-logs/export, log-retention, suspicious-activity
frontend/app/(dashboard)/configuration/logs/page.tsx          # Application Logs + Export
frontend/app/(dashboard)/configuration/log-retention/page.tsx # Log retention UI
```

**Recipes:**
- [Extend logging](recipes/extend-logging.md)

## Scheduled Jobs / Admin Tasks

**Read first:**
```
backend/app/Services/ScheduledTaskService.php   # Command whitelist, run(), last run, rate limit
backend/app/Http/Controllers/Api/JobController.php
backend/app/Models/TaskRun.php
backend/routes/api.php  # jobs/* routes (admin)
frontend/app/(dashboard)/configuration/jobs/page.tsx  # Scheduled Tasks, Queue, Failed Jobs, Run Now
```

**Also useful:**
```
backend/routes/console.php       # Schedule definitions (backup:run, log:check-suspicious, etc.)
backend/database/migrations/     # task_runs table
```

Manual run is whitelist-only (`backup:run`, `log:cleanup`, `log:check-suspicious`). Runs are recorded in `task_runs` and audited.

## Docker/Infrastructure Work

**Read first:**
```
docs/adr/009-docker-single-container.md
docker/Dockerfile
docker/supervisord.conf
docker/nginx.conf
docker/entrypoint.sh
docker-compose.yml
```

**Also useful:**
```
docker-compose.prod.yml
.env.example
```

## Database Work

**Read first:**
```
docs/adr/010-database-abstraction.md
backend/config/database.php
backend/database/migrations/                    # Existing schema
```

**Also useful:**
```
backend/app/Models/                             # Eloquent models
```

## Testing Work

**Read first:**
```
docs/adr/008-testing-strategy.md
e2e/                                            # Playwright tests
backend/tests/                                  # PHP tests
frontend/__tests__/                             # Vitest tests (if exists)
```

## Navigation/Layout Work

**Read first:**
```
docs/adr/011-global-navigation-architecture.md
frontend/components/sidebar.tsx
frontend/components/header.tsx
frontend/components/logo.tsx
frontend/config/app.ts
frontend/app/(dashboard)/layout.tsx
```

## Branding/UI Customization Work

**Read first:**
```
docs/plans/branding-ui-consistency-roadmap.md
frontend/config/app.ts                  # Centralized app configuration
frontend/components/logo.tsx            # Logo component with variants
frontend/app/globals.css                # CSS theme variables
```

**Also useful:**
```
frontend/components/header.tsx          # Uses Logo component
frontend/components/sidebar.tsx         # Uses Logo component
.env.example                            # Branding environment variables
```

## Mobile/Responsive Work

**Read first:**
```
docs/adr/013-responsive-mobile-first-design.md    # Responsive design decisions
docs/plans/mobile-responsive-roadmap.md           # Implementation roadmap
frontend/lib/use-mobile.ts                        # Mobile detection hook
frontend/components/ui/sheet.tsx                  # Drawer component for mobile nav
```

**Also useful:**
```
frontend/components/sidebar.tsx         # Responsive sidebar implementation
frontend/components/app-shell.tsx       # Main layout with responsive structure
frontend/components/header.tsx          # Header with mobile menu toggle
frontend/tailwind.config.ts             # Tailwind breakpoint configuration
frontend/app/globals.css                # Global responsive styles
```

**Cursor rule:** `.cursor/rules/responsive-mobile-first.mdc`
**Recipe:** `docs/ai/recipes/make-component-responsive.md`

## Adding a New Feature (Full Stack)

**Read in order:**
1. `docs/roadmaps.md` - Check if planned
2. `docs/architecture.md` - Find relevant ADRs
3. Relevant ADR file - Understand design decisions
4. `backend/routes/api.php` - See route patterns
5. Similar existing feature - Copy patterns
6. `docs/ai/patterns.md` - Code style reference
7. Relevant recipe in `docs/ai/recipes/` - Step-by-step guide
