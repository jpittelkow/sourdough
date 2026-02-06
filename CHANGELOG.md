# Changelog

All notable changes to Sourdough will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2026-02-05

### Changed
- Restructured AI documentation: split patterns and anti-patterns into individual files under `docs/ai/patterns/` and `docs/ai/anti-patterns/`
- Consolidated Cursor rules: removed 9 individual rule files, replaced with single `development-workflow.mdc`
- Hardened GitHub Actions CI/CD workflows (ci.yml, release.yml)
- Improved Docker configuration: entrypoint, supervisord, Dockerfile optimizations
- Updated search pages config with comprehensive page definitions
- Improved SSO service configuration and redirect URI handling
- Enhanced onboarding wizard modal with better styling and completion step
- Improved dialog, form-field, and provider components
- Mobile-first responsive updates across all configuration and user pages
- Updated PWA manifest and service worker with Workbox integration

### Added
- In-app help center with searchable documentation (`help-center-modal`, `help-search`, `help-content`)
- Workbox library files for advanced service worker caching strategies
- Database migration for group and task indexes (performance)
- AI documentation guide (`docs/ai/documentation-guide.md`)
- Add help article recipe (`docs/ai/recipes/add-help-article.md`)
- Documentation architecture review roadmap
- PWA icons: `apple-icon.png`, `favicon.ico`
- New utility functions in `frontend/lib/utils.ts`
- App config enhancements in `frontend/lib/app-config.tsx`
- Request queue improvements for offline support
- Journal entries for all changes in this release
- `ApiResponseTrait` enhancements for consistent API responses
- `HasGroups` trait improvements
- Storage alert command enhancements
- Backend bootstrap and config service provider updates

### Fixed
- SSO redirect URI configuration fix
- SSO test toggle behavior fix
- Wizard and help center styling fixes
- Cache permissions fix for production
- Meilisearch production permissions fix
- Frontend code review Phase 2 fixes across multiple components
- Search service reliability improvements

### Security
- GitHub Actions workflow hardening (pinned versions, reduced permissions)

## [0.1.7] - 2026-02-05

### Security
- Added SSRF validation for LLM vision `image_url` parameter via `UrlValidationService` (rejects internal/private URLs)
- Completed Phase 1 security and authentication code review

### Added
- Mailgun and SendGrid mail driver support (composer packages, config, runtime configuration)
- Mail settings now configure Mailgun, SendGrid, SES, and Postmark at runtime
- Environment variables for `MAILGUN_DOMAIN`, `MAILGUN_SECRET`, `MAILGUN_ENDPOINT`, `SENDGRID_API_KEY`
- Error logging with trace for failed test emails

### Fixed
- Email settings form: provider and encryption selects now properly mark form as dirty
- Email test/save error messages now show validation details and driver-not-installed hints
- Toast notifications in email settings no longer trigger React setState-in-render warnings
- API error interceptor now preserves response object for detailed error handling
- Fixed corrupted `.gitignore` encoding for `nul` entry

## [0.1.6] - 2026-02-05

### Fixed
- Removed duplicate Toaster component to resolve React "setState in render" error (Toaster now only in Providers)

## [0.1.5] - 2026-02-05

### Changed
- **BREAKING**: Upgraded Next.js from 14.2.35 to 16.1.6 (uses Turbopack by default)
- **BREAKING**: Upgraded ESLint from 8.x to 9.x with flat config format
- **BREAKING**: Upgraded vitest from 1.x to 4.x
- Upgraded Meilisearch from 1.6.2 to 1.34.2
- Upgraded eslint-config-next to 16.1.6
- Migrated ESLint config from `.eslintrc.json` to `eslint.config.mjs` (flat config)
- Updated `next.config.js` to use Turbopack instead of webpack
- Updated lint script from `next lint` to `eslint .`
- Docker: Refactored to use Next.js standalone output (reduces image size ~150-200MB)
- Docker: Pinned Composer version to 2.8
- Docker: Optimized file ownership with `COPY --chown` flags

### Fixed
- Fixed all 8 npm security vulnerabilities (4 moderate, 4 high)
- Fixed useEffect missing dependency warnings in 16 frontend files
- Replaced 10 `<img>` tags with `next/image` components
- Fixed npm cache permissions in Docker development mode
- Page titles now respect configured app name from System Settings on all routes (auth, dashboard, landing, share). Auth pages use `usePageTitle` via `AuthPageLayout`; root and share pages call it directly; dashboard routes use `PageTitleManager` with full route-to-title map including configuration, notifications, and share.

### Added
- Initial documentation structure

## [0.1.0] - 2026-01-24

### Added

#### Core Infrastructure
- Laravel 11 backend with PHP 8.3+ support
- Next.js 14+ frontend with App Router and TypeScript
- Single Docker container deployment with Supervisor
- Multi-database support (SQLite default, MySQL, PostgreSQL)
- Versioning system with `/api/version` endpoint
- GitHub Actions CI/CD pipeline (ci.yml, release.yml)

#### Authentication System
- Email/password authentication with Laravel Sanctum
- User registration with email verification
- Password reset flow with email delivery
- Session-based authentication for SPA

#### SSO Integration
- Google OAuth2 provider
- GitHub OAuth2 provider
- Microsoft OAuth2 provider
- Apple OAuth2 provider
- Discord OAuth2 provider
- GitLab OAuth2 provider
- Generic OIDC provider support for enterprise IdPs
- Account linking (SSO to existing accounts)

#### Two-Factor Authentication
- TOTP implementation (Google Authenticator compatible)
- 10 one-time recovery codes
- 2FA setup and verification flow
- 2FA challenge during login

#### Notification System
- Multi-channel notification orchestrator
- Email channel (SMTP, Mailgun, SendGrid, SES, Postmark)
- Telegram bot integration
- Discord webhook integration
- Slack webhook integration
- SMS via Twilio
- In-app notifications with database storage
- User notification preferences

#### AI/LLM Orchestration
- Multi-provider LLM abstraction layer
- Claude (Anthropic) provider with vision support
- OpenAI provider (GPT-4, GPT-4o) with vision support
- Gemini (Google) provider with vision support
- Ollama provider for local/self-hosted models
- Single mode (direct query to one provider)
- Aggregation mode (parallel query, primary synthesizes)
- Council mode (voting/consensus engine)
- Request logging for debugging and cost tracking
- Encrypted API key storage

#### Backup & Restore
- ZIP-based backup format with manifest.json
- Database backup (SQLite copy, MySQL/PostgreSQL dump)
- Storage/file backup
- Configuration backup (encrypted)
- Manual backup creation via admin UI
- Backup download and restore

#### Frontend
- Modern UI with shadcn/ui components
- Dark mode support with system preference detection
- Authentication pages (login, register, forgot password, reset password, verify email)
- Dashboard with protected routes
- Admin section with backup management
- Settings pages (profile, security, notifications, AI providers)
- SSO login buttons
- Two-factor authentication setup UI

#### Documentation
- Architecture Decision Records (ADR) system
- ADR-001 through ADR-010 documenting all major decisions
- API endpoint documentation
- Project README with quick start guide

### Technical Details

#### Backend Structure
```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── BackupController.php
│   │   ├── LLMController.php
│   │   ├── NotificationController.php
│   │   ├── ProfileController.php
│   │   ├── SettingController.php
│   │   ├── SSOController.php
│   │   ├── TwoFactorController.php
│   │   └── VersionController.php
│   ├── Models/
│   │   ├── AIProvider.php
│   │   ├── AIRequestLog.php
│   │   ├── Notification.php
│   │   ├── Setting.php
│   │   ├── SocialAccount.php
│   │   └── User.php
│   └── Services/
│       ├── Auth/TwoFactorService.php
│       ├── Backup/BackupService.php
│       ├── LLM/
│       │   ├── LLMOrchestrator.php
│       │   └── Providers/
│       ├── Notifications/
│       │   ├── NotificationOrchestrator.php
│       │   └── Channels/
│       └── VersionService.php
```

#### Frontend Structure
```
frontend/
├── app/
│   ├── (auth)/          # Public auth pages
│   ├── (dashboard)/     # Protected pages
│   └── layout.tsx
├── components/
│   ├── auth/            # Auth-specific components
│   ├── ui/              # shadcn/ui components
│   └── providers.tsx
└── lib/
    ├── api.ts           # API client
    ├── auth.ts          # Auth utilities
    └── utils.ts         # General utilities
```

#### Docker Structure
```
docker/
├── Dockerfile           # Multi-stage build
├── entrypoint.sh        # Startup script
├── nginx.conf           # Nginx configuration
├── php.ini              # PHP configuration
└── supervisord.conf     # Process manager config
```

[Unreleased]: https://github.com/jpittelkow/sourdough/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jpittelkow/sourdough/releases/tag/v0.1.0
