# Context Loading Guide

Which files to read first based on your task type.

## Frontend UI Work

**Read first:**
```
frontend/app/(dashboard)/           # Existing page patterns
frontend/components/ui/             # shadcn components (CLI-managed; frontend/components.json)
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
```

**Also useful:**
```
backend/app/Models/                             # Data models
backend/database/migrations/                    # Database schema
```

## Notifications Work

**Read first:**
```
docs/adr/005-notification-system-architecture.md
backend/app/Services/Notifications/NotificationOrchestrator.php
backend/app/Services/Notifications/Channels/    # Existing channels
backend/config/notifications.php
```

**Also useful:**
```
backend/app/Http/Controllers/Api/NotificationController.php
backend/app/Models/Notification.php
frontend/app/(dashboard)/settings/notifications/page.tsx
```

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
docs/plans/settings-restructure-roadmap.md      # Future direction
frontend/app/(dashboard)/settings/              # Existing pages
frontend/app/(dashboard)/settings/layout.tsx    # Settings nav
backend/app/Http/Controllers/Api/SettingController.php
```

**Also useful:**
```
backend/app/Models/Setting.php
backend/app/Models/SystemSetting.php
```

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
```

## Backup System Work

**Read first:**
```
docs/adr/007-backup-system-design.md
backend/app/Services/Backup/BackupService.php
backend/app/Services/Backup/Destinations/       # Existing destinations
```

**Also useful:**
```
backend/app/Http/Controllers/Api/BackupController.php
frontend/app/(dashboard)/admin/backup/page.tsx
```

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

## Adding a New Feature (Full Stack)

**Read in order:**
1. `docs/roadmaps.md` - Check if planned
2. `docs/architecture.md` - Find relevant ADRs
3. Relevant ADR file - Understand design decisions
4. `backend/routes/api.php` - See route patterns
5. Similar existing feature - Copy patterns
6. `docs/ai/patterns.md` - Code style reference
7. Relevant recipe in `docs/ai/recipes/` - Step-by-step guide
