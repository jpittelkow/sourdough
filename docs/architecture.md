# Architecture

## Architecture Overview

Sourdough uses a decoupled architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Docker Container                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Nginx      │───▶│  Next.js     │    │  PHP-FPM     │  │
│  │   (Proxy)    │    │  Frontend    │    │  Laravel API │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                        │          │
│         └────────────────┬───────────────────────┘          │
│                          ▼                                   │
│                  ┌──────────────┐                           │
│                  │   SQLite     │                           │
│                  │   Database   │                           │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Decision Records

Architecture Decision Records (ADRs) document all significant design decisions:

- [ADR-001: Technology Stack](adr/001-technology-stack.md) - Laravel 11, Next.js 14, SQLite, Docker selection rationale
  - Key files: `composer.json`, `package.json`, `backend/config/app.php`, `frontend/next.config.js`
- [ADR-002: Authentication Architecture](adr/002-authentication-architecture.md) - Laravel Sanctum session-based authentication
  - Key files: `backend/app/Http/Controllers/Api/AuthController.php`, `backend/app/Http/Controllers/Api/UserController.php`, `backend/config/auth.php`, `backend/config/sanctum.php`, `frontend/lib/auth.ts`, `frontend/app/(auth)/`, `frontend/app/(dashboard)/configuration/users/page.tsx`, `frontend/components/admin/user-table.tsx`, `frontend/components/admin/user-dialog.tsx`
- [ADR-003: SSO Provider Integration](adr/003-sso-provider-integration.md) - OAuth2/OIDC provider integration strategy
  - Key files: `backend/app/Http/Controllers/Api/SSOController.php`, `backend/app/Services/Auth/SSOService.php`, `backend/config/sso.php`, `frontend/components/auth/sso-buttons.tsx`
- [ADR-004: Two-Factor Authentication](adr/004-two-factor-authentication.md) - TOTP implementation with recovery codes
  - Key files: `backend/app/Http/Controllers/Api/TwoFactorController.php`, `backend/app/Services/Auth/TwoFactorService.php`, `frontend/components/auth/two-factor-form.tsx`
- [ADR-005: Notification System Architecture](adr/005-notification-system-architecture.md) - Multi-channel notification orchestrator
  - Key files: `backend/app/Services/Notifications/NotificationOrchestrator.php`, `backend/app/Services/Notifications/NotificationChannelMetadata.php`, `backend/app/Services/Notifications/Channels/`, `backend/app/Http/Controllers/Api/NotificationChannelConfigController.php`, `backend/app/Http/Controllers/Api/UserNotificationSettingsController.php`, `backend/config/notifications.php`
- [ADR-006: LLM Orchestration Modes](adr/006-llm-orchestration-modes.md) - Single, Aggregation, Council mode designs
  - Key files: `backend/app/Services/LLM/LLMOrchestrator.php`, `backend/app/Services/LLM/Providers/`, `backend/app/Services/LLMModelDiscoveryService.php`, `backend/app/Http/Controllers/Api/LLMModelController.php`, `backend/config/llm.php`
- [ADR-007: Backup System Design](adr/007-backup-system-design.md) - Backup format, scheduling, remote storage
  - Key files: `backend/app/Services/Backup/BackupService.php`, `backend/app/Services/Backup/Destinations/`, `backend/config/backup.php`, `backend/app/Http/Controllers/Api/BackupSettingController.php`, `backend/config/settings-schema.php` (backup group)
  - **Full backup documentation:** [Backup & Restore](backup.md) (user, admin, developer guides; key files; recipes and patterns)
- [ADR-008: Testing Strategy](adr/008-testing-strategy.md) - Pest PHP, Vitest, Playwright testing approach
  - Key files: `playwright.config.ts`, `frontend/vitest.config.ts`, `backend/phpunit.xml`, `e2e/`, `backend/tests/`, `frontend/__tests__/`
- [ADR-009: Docker Single-Container Architecture](adr/009-docker-single-container.md) - Single container with Supervisor process management
  - Key files: `docker/Dockerfile`, `docker/supervisord.conf`, `docker/nginx.conf`, `docker-compose.yml`, `docker-compose.prod.yml`
- [ADR-010: Database Abstraction Strategy](adr/010-database-abstraction.md) - SQLite default with MySQL/PostgreSQL/Supabase support
  - Key files: `backend/config/database.php`, `backend/database/migrations/`
- [ADR-011: Global Navigation Architecture](adr/011-global-navigation-architecture.md) - Frontend navigation and routing structure
  - Key files: `frontend/components/sidebar.tsx`, `frontend/components/app-shell.tsx`, `frontend/components/header.tsx`, `frontend/components/logo.tsx`, `frontend/config/app.ts`
- [ADR-012: Admin-Only Settings Access](adr/012-admin-only-settings.md) - Admin authorization for system settings
  - Key files: `frontend/app/(dashboard)/settings/layout.tsx`, `frontend/app/(dashboard)/admin/`, `frontend/components/admin/`
- [ADR-013: Responsive Mobile-First Design](adr/013-responsive-mobile-first-design.md) - Mobile-first responsive design approach
  - Key files: `frontend/lib/use-mobile.ts`, `frontend/components/sidebar.tsx`, `frontend/components/app-shell.tsx`, `frontend/components/header.tsx`, `frontend/components/ui/sheet.tsx`, `frontend/tailwind.config.ts`
- [ADR-014: Database Settings with Environment Fallback](adr/014-database-settings-env-fallback.md) - Database-stored settings with env fallback and boot-time config injection
  - Key files: `backend/app/Services/SettingService.php`, `backend/app/Providers/ConfigServiceProvider.php`, `backend/config/settings-schema.php`, `backend/app/Models/SystemSetting.php`
- [ADR-015: Environment-Only Settings](adr/015-env-only-settings.md) - Settings that must remain in .env (APP_KEY, DB_*, CACHE_STORE, LOG_*, APP_ENV, APP_DEBUG)
  - Key files: `backend/config/settings-schema.php`, `.env.example`
- [ADR-016: Email Template System](adr/016-email-template-system.md) - Database-stored email templates with variable replacement; TemplatedMail Mailable; User overrides (password reset, email verification); EmailChannel uses notification template
  - Key files: `backend/app/Models/EmailTemplate.php`, `backend/app/Services/EmailTemplateService.php`, `backend/app/Services/RenderedEmail.php`, `backend/app/Mail/TemplatedMail.php`, `backend/app/Models/User.php` (sendPasswordResetNotification, sendEmailVerificationNotification), `backend/app/Services/Notifications/Channels/EmailChannel.php`, `backend/app/Http/Controllers/Api/EmailTemplateController.php`, `backend/database/seeders/EmailTemplateSeeder.php`; frontend: `frontend/app/(dashboard)/configuration/email-templates/page.tsx`, `frontend/app/(dashboard)/configuration/email-templates/[key]/page.tsx`, `frontend/components/email-template-editor.tsx`, `frontend/components/variable-picker.tsx`

### Logging and Observability

Application logging (operational and diagnostic events) is separate from audit logging (user actions). Backend uses Laravel `Log` facade with structured context; correlation IDs and request context are added via `ContextProcessor`. Frontend errors are reported to `POST /api/client-errors` and logged server-side. See [Logging](logging.md) for standards, configuration, and key files.

**Key files**: `backend/config/logging.php`, `backend/app/Logging/ContextProcessor.php`, `backend/app/Http/Middleware/AddCorrelationId.php`, `backend/app/Http/Controllers/Api/ClientErrorController.php`, `frontend/lib/error-logger.ts`, `frontend/components/error-boundary.tsx`, `frontend/components/error-handler-setup.tsx`

## Settings Architecture

### Database Settings with Env Fallback (ADR-014)

System-wide configurable settings are stored in `system_settings` with environment fallback:

- **SettingService**: `get()`, `getGroup()`, `set()`, `reset()`, `all()` with file-based caching and env fallback per `backend/config/settings-schema.php`
- **ConfigServiceProvider**: Injects database settings into Laravel config at boot (skips when DB not ready)
- **Encryption**: Sensitive values stored with `is_encrypted`; model decrypts on read

**Key files**: `backend/app/Services/SettingService.php`, `backend/app/Providers/ConfigServiceProvider.php`, `backend/config/settings-schema.php`, `backend/app/Models/SystemSetting.php`, `backend/app/Http/Controllers/Api/MailSettingController.php`

### Settings Caching Strategy

- Settings cached via SettingService (file store, not DB) with TTL; cache cleared on any `set()` or `reset()`
- In-memory cache for same-request performance

**Key files**: `backend/app/Services/SettingService.php`, `backend/config/cache.php`

### Settings Validation

Validation rules per setting type in controllers; schema defines env keys and defaults in `backend/config/settings-schema.php`.

**Key files**: `backend/config/settings-schema.php`, `backend/app/Http/Controllers/Api/MailSettingController.php`, `backend/app/Http/Controllers/Api/SettingController.php`
