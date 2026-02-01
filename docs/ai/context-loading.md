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

**Recipes:**
- [Add UI component](recipes/add-ui-component.md)
- [Add collapsible section](recipes/add-collapsible-section.md)
- [Add provider icon](recipes/add-provider-icon.md)

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
backend/app/Services/LLMModelDiscoveryService.php   # Model discovery (Test Key / Fetch Models)
backend/app/Http/Controllers/Api/LLMModelController.php
frontend/app/(dashboard)/configuration/ai/page.tsx  # AI/LLM settings UI, providerTemplates
```

For adding a new LLM provider with model discovery, use [Recipe: Add LLM Provider](recipes/add-llm-provider.md).

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
- [Recipe: Add settings page](recipes/add-settings-page.md) – Settings page with SettingService

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

## Notification Template Work

**Read first:**
```
docs/adr/017-notification-template-system.md
backend/app/Models/NotificationTemplate.php
backend/app/Services/NotificationTemplateService.php
backend/database/seeders/NotificationTemplateSeeder.php
```

**Also useful (backend):**
```
backend/app/Http/Controllers/Api/NotificationTemplateController.php
backend/routes/api.php
backend/app/Services/Notifications/NotificationOrchestrator.php
backend/app/Services/Notifications/Channels/DatabaseChannel.php
backend/app/Services/Notifications/Channels/WebPushChannel.php
backend/app/Services/Notifications/Channels/EmailChannel.php
```

**Frontend (Admin UI):**
```
frontend/app/(dashboard)/configuration/notification-templates/page.tsx
frontend/app/(dashboard)/configuration/notification-templates/[id]/page.tsx
frontend/app/(dashboard)/configuration/layout.tsx
```

**Recipes:**
- [Add Notification Template](recipes/add-notification-template.md)
- [Trigger Notifications](recipes/trigger-notifications.md) — sendByType()
- [Keep notification template variables up to date](recipes/keep-notification-template-variables-up-to-date.md)

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
backend/app/Services/Auth/SSOService.php
backend/app/Services/Auth/TwoFactorService.php
backend/app/Services/Auth/PasskeyService.php
frontend/app/(auth)/                            # Auth pages
frontend/components/auth/                       # Auth components
  - auth-page-layout.tsx                        # Layout wrapper
  - auth-divider.tsx                            # SSO/email divider
  - auth-state-card.tsx                         # Success/error states
  - sso-buttons.tsx                             # SSO provider buttons (login/register)
frontend/components/admin/
  - sso-setup-modal.tsx                         # SSO setup instructions per provider
frontend/components/ui/
  - form-field.tsx                              # Label + description/helpLink + Input + error
  - loading-button.tsx                           # Button with spinner
```

**Recipes:**
- [Add SSO provider](recipes/add-sso-provider.md)

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
backend/routes/api.php                          # users routes (can:admin), PUT /users/{user}/groups
backend/app/Http/Traits/AdminAuthorizationTrait.php
frontend/components/admin/user-group-picker.tsx # Group assignment in user edit
frontend/lib/use-groups.ts                      # useGroups() for filter/picker
frontend/lib/auth.ts                            # isAdminUser(user) for admin checks (group-based)
```

## User Groups Work

**Read first:**
```
backend/app/Models/UserGroup.php
backend/app/Models/GroupPermission.php
backend/app/Traits/HasGroups.php
backend/app/Services/GroupService.php
backend/app/Services/PermissionService.php
backend/app/Enums/Permission.php
```

**Also useful (backend):**
```
backend/app/Http/Controllers/Api/GroupController.php
backend/routes/api.php                          # groups, permissions routes
backend/app/Http/Resources/GroupResource.php
```

**Frontend (Admin UI):**
```
frontend/app/(dashboard)/configuration/groups/page.tsx
frontend/components/admin/group-table.tsx
frontend/components/admin/group-dialog.tsx
frontend/components/admin/member-manager.tsx
frontend/components/admin/permission-matrix.tsx
frontend/components/admin/user-group-picker.tsx   # Group multi-select (user edit)
frontend/app/(dashboard)/configuration/layout.tsx  # Groups nav item (permission-based filtering)
frontend/lib/use-groups.ts                        # useGroups() hook
frontend/lib/use-permission.ts                    # usePermission(), usePermissions()
frontend/components/permission-gate.tsx           # PermissionGate component
```

**User Management (groups integration):**
```
backend/app/Http/Controllers/Api/UserController.php  # index (groups + filter), show (groups), updateGroups
frontend/app/(dashboard)/configuration/users/page.tsx
frontend/components/admin/user-table.tsx             # Groups column
frontend/components/admin/user-dialog.tsx            # UserGroupPicker
```

**Recipes:**
- [Create custom group](recipes/create-custom-group.md)
- [Add new permission](recipes/add-new-permission.md)
- [Assign user to groups](recipes/assign-user-to-groups.md)

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

## Storage Settings Work

**Read first:**
```
backend/app/Services/StorageService.php                       # Provider config, testConnection, buildDiskConfig
backend/app/Http/Controllers/Api/StorageSettingController.php  # Settings, paths, health, stats, test endpoint
backend/config/filesystems.php                                # Disk configuration (local, s3, gcs, azure, do_spaces, minio, b2)
frontend/app/(dashboard)/configuration/storage/page.tsx        # Storage settings UI (driver dropdown, dynamic forms, Test Connection)
```

**Also useful:**
```
backend/app/Providers/AppServiceProvider.php  # GCS/Azure Storage::extend() when packages installed
frontend/components/provider-icons.tsx        # Storage provider icons (s3, gdrive, azure, do_spaces, minio, b2)
docs/plans/storage-settings-roadmap.md       # Phases 1–2 done; Phases 3–4 (file manager, analytics) planned
```

**Recipes:**
- [Add storage provider](recipes/add-storage-provider.md)

## Search Work

**Read first:**
```
backend/app/Services/Search/SearchService.php
backend/app/Http/Controllers/Api/SearchController.php
backend/config/scout.php
backend/routes/api.php                    # search, search/suggestions (log.access:User)
frontend/components/search/search-modal.tsx
frontend/components/search/search-provider.tsx
frontend/lib/search.ts
frontend/lib/search-pages.ts              # Static page search (Pages group in Cmd+K)
```

**Also useful:**
```
backend/app/Console/Commands/SearchReindexCommand.php
backend/app/Http/Controllers/Api/Admin/SearchAdminController.php
frontend/app/(dashboard)/configuration/search/page.tsx
frontend/components/search/search-result-icon.tsx
```

**Compliance:** Search and suggestions endpoints return user data; they use `log.access:User` middleware. Transform methods must escape title/subtitle (XSS). See [Patterns: SearchService](patterns.md#searchservice-pattern) and [Recipe: Add searchable model](recipes/add-searchable-model.md).

**Recipes:**
- [Add searchable model](recipes/add-searchable-model.md)
- [Add searchable page](recipes/add-searchable-page.md)

## Dashboard/Widget Work

> **Note**: Dashboard uses static, developer-defined widgets (no user configuration).
> Widgets are React components added directly to the dashboard page.

**Read first:**
```
frontend/app/(dashboard)/dashboard/page.tsx         # Main dashboard layout
frontend/components/dashboard/                      # Widget components
docs/ai/recipes/add-dashboard-widget.md             # Widget creation guide
```

**Also useful:**
```
backend/app/Http/Controllers/Api/DashboardController.php  # Data endpoints for widgets
frontend/components/dashboard/widgets/                    # Reference: welcome, stats, quick-actions
frontend/lib/use-permission.ts                            # Permission-based visibility
```

**Recipes:**
- [Add Dashboard Widget](recipes/add-dashboard-widget.md)

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

**Recipes:**
- [Add tests](recipes/add-tests.md)

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

## PWA Work

**Read first:**
```
docs/plans/pwa-roadmap.md                         # PWA phases and tasks
frontend/public/manifest.json                     # Static manifest (API route overrides at /api/manifest)
frontend/app/api/manifest/route.ts                # Dynamic manifest (branding, full icon set, shortcuts, share_target)
frontend/public/sw.js                             # Service worker (caching, push, sync)
frontend/lib/use-install-prompt.ts                # Install prompt hook
frontend/components/install-prompt.tsx            # Install banner component
frontend/lib/request-queue.ts                      # Offline request queue and background sync
```

**Also useful:**
```
frontend/lib/service-worker.ts                    # SW registration
frontend/lib/web-push.ts                          # Push subscription
frontend/components/service-worker-setup.tsx      # SW registration in app
frontend/components/app-shell.tsx                 # InstallPrompt integration
frontend/app/(dashboard)/user/preferences/page.tsx  # Install App section
frontend/app/share/page.tsx                       # Share Target handler
scripts/generate-pwa-icons.mjs                    # Icon generation
```

**Pattern:** [PWA Install Prompt](patterns.md#pwa-install-prompt-pattern)

**Recipes:**
- [Add PWA install prompt](recipes/add-pwa-install-prompt.md)

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

## Webhooks Work

**Read first:**
```
backend/app/Http/Controllers/Api/WebhookController.php
backend/app/Models/Webhook.php
backend/app/Models/WebhookDelivery.php
backend/routes/api.php                    # webhooks routes (can:settings.view/edit)
```

**Also useful:**
```
frontend/app/(dashboard)/configuration/webhooks/page.tsx  # Webhook management UI (if exists)
backend/app/Services/WebhookService.php   # Webhook delivery service (if exists)
```

Webhooks allow external systems to receive notifications when events occur. Endpoints: list, create, update, delete, test, view deliveries.

## API Tokens Work

**Read first:**
```
backend/app/Http/Controllers/Api/ApiTokenController.php
backend/routes/api.php                    # api-tokens routes (authenticated)
```

**Also useful:**
```
frontend/app/(dashboard)/user/profile/page.tsx  # API tokens section in profile
```

API tokens allow programmatic access to the API (uses Laravel Sanctum's built-in `PersonalAccessToken` model). Users can create, list, and revoke their own tokens.

## Adding a New Feature (Full Stack)

**Read in order:**
1. `docs/roadmaps.md` - Check if planned
2. `docs/architecture.md` - Find relevant ADRs
3. Relevant ADR file - Understand design decisions
4. `backend/routes/api.php` - See route patterns
5. Similar existing feature - Copy patterns
6. `docs/ai/patterns.md` - Code style reference
7. Relevant recipe in `docs/ai/recipes/` - Step-by-step guide
