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
  - Key files: `backend/app/Http/Controllers/Api/AuthController.php`, `backend/config/auth.php`, `backend/config/sanctum.php`, `frontend/lib/auth.ts`, `frontend/app/(auth)/`
- [ADR-003: SSO Provider Integration](adr/003-sso-provider-integration.md) - OAuth2/OIDC provider integration strategy
  - Key files: `backend/app/Http/Controllers/Api/SSOController.php`, `backend/app/Services/Auth/SSOService.php`, `backend/config/sso.php`, `frontend/components/auth/sso-buttons.tsx`
- [ADR-004: Two-Factor Authentication](adr/004-two-factor-authentication.md) - TOTP implementation with recovery codes
  - Key files: `backend/app/Http/Controllers/Api/TwoFactorController.php`, `backend/app/Services/Auth/TwoFactorService.php`, `frontend/components/auth/two-factor-form.tsx`
- [ADR-005: Notification System Architecture](adr/005-notification-system-architecture.md) - Multi-channel notification orchestrator
  - Key files: `backend/app/Services/Notifications/NotificationOrchestrator.php`, `backend/app/Services/Notifications/NotificationChannelMetadata.php`, `backend/app/Services/Notifications/Channels/`, `backend/app/Http/Controllers/Api/NotificationChannelConfigController.php`, `backend/app/Http/Controllers/Api/UserNotificationSettingsController.php`, `backend/config/notifications.php`
- [ADR-006: LLM Orchestration Modes](adr/006-llm-orchestration-modes.md) - Single, Aggregation, Council mode designs
  - Key files: `backend/app/Services/LLM/LLMOrchestrator.php`, `backend/app/Services/LLM/Providers/`, `backend/config/llm.php`
- [ADR-007: Backup System Design](adr/007-backup-system-design.md) - Backup format, scheduling, remote storage
  - Key files: `backend/app/Services/Backup/BackupService.php`, `backend/app/Services/Backup/Destinations/`, `backend/config/backup.php`
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

## Settings Architecture

### Settings Storage Pattern

Current implementation uses user-scoped settings (`user_id`, `group`, `key`, `value`). For system-wide settings, consider:

```
settings table (existing - user settings)
├── user_id (nullable for system settings)
├── group
├── key  
└── value (JSON)

OR

system_settings table (new)
├── group
├── key
├── value (JSON)
├── is_public (visible to non-admins?)
└── updated_by
```

**Key files**: `backend/app/Http/Controllers/Api/SettingController.php`, `backend/database/migrations/`

### Settings Caching Strategy

For performance with system settings:
- Cache system settings on boot
- Clear cache on setting update
- Consider Redis for multi-instance deployments

**Key files**: `backend/config/cache.php`, `backend/app/Http/Controllers/Api/SettingController.php`

### Settings Validation

Implement validation rules per setting type:
- Type coercion (string to boolean, etc.)
- Range validation for numeric settings
- Enum validation for select fields
- Dependency validation (setting A requires setting B)

**Key files**: `backend/app/Http/Requests/`, `backend/app/Http/Controllers/Api/SettingController.php`
