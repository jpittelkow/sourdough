# Changelog

All notable changes to Sourdough will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
