# Quick Reference

## Project Structure

```
backend/
├── app/Http/Controllers/Api/   # REST API endpoints
├── app/Services/               # Business logic (Auth/, Backup/, LLM/, Notifications/)
├── app/Models/                 # Eloquent models
├── config/                     # Laravel config files
├── database/migrations/        # Database schema
└── routes/api.php              # API route definitions

frontend/
├── app/(auth)/                 # Auth pages (login, register, forgot-password)
├── app/(dashboard)/            # Protected pages (dashboard, settings, admin)
├── components/                 # React components (ui/ for shadcn primitives)
├── lib/                        # Utilities (api.ts, auth.ts, utils.ts)
└── next.config.js              # Next.js configuration

docker/
├── Dockerfile                  # Container definition
├── supervisord.conf            # Process management (nginx, php-fpm, nextjs)
├── nginx.conf                  # Web server / reverse proxy
└── entrypoint.sh               # Container startup script

docs/                           # Documentation (this directory)
e2e/                            # Playwright E2E tests
.cursor/rules/                  # Cursor IDE rules (auto-loaded)
```

## Key Technologies

- Backend: Laravel 11, PHP 8.3+, Laravel Sanctum
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- Database: SQLite (default), MySQL, PostgreSQL, Supabase
- Container: Docker with Nginx + PHP-FPM + Supervisor
- Testing: Pest PHP, Vitest, Playwright

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Controller | `{Feature}Controller.php` | `AuthController.php` |
| Service | `{Feature}Service.php` | `BackupService.php` |
| Model | `{Singular}.php` | `User.php`, `Webhook.php` |
| Frontend page | `page.tsx` in route folder | `app/(dashboard)/settings/page.tsx` |
| UI component | `kebab-case.tsx` | `two-factor-form.tsx` |
| API utility | `camelCase` exports in `lib/` | `lib/api.ts` |

## Common Commands

```bash
# Docker
docker-compose up -d                    # Start dev environment
docker-compose up -d --build            # Rebuild and start
docker-compose logs -f                  # View logs
docker-compose exec app bash            # Shell into container

# Laravel (inside container)
php artisan migrate                     # Run migrations
php artisan make:model {Name} -m        # Create model + migration
php artisan route:list                  # List API routes

# Frontend
npm run dev                             # Dev server (auto-started in Docker)
npm run build                           # Production build
npm run lint                            # Lint check

# shadcn/ui (run from frontend/)
npx shadcn@latest add <component>       # Add a new component (e.g. tooltip, sheet)
npx shadcn@latest add <component> --overwrite   # Replace existing component
```

## Where to Find...

| Task | Location | ADR |
|------|----------|-----|
| Add API endpoint | `backend/app/Http/Controllers/Api/` | - |
| Add business logic | `backend/app/Services/{Feature}/` | - |
| Auth flow | `AuthController.php`, `frontend/lib/auth.ts` | ADR-002 |
| SSO providers | `SSOService.php`, `sso-buttons.tsx` | ADR-003 |
| 2FA | `TwoFactorService.php`, `two-factor-form.tsx` | ADR-004 |
| Notifications | `NotificationOrchestrator.php`, `Channels/` | ADR-005 |
| LLM calls | `LLMOrchestrator.php`, `Providers/` | ADR-006 |
| Backups | `BackupService.php`, `Destinations/` | ADR-007 |
| Docker config | `docker/`, `docker-compose.yml` | ADR-009 |
| Add settings page | `frontend/app/(dashboard)/settings/` | ADR-012 |
| Add admin page | `frontend/app/(dashboard)/admin/` | ADR-012 |
| Add shadcn component | `frontend/` then `npx shadcn@latest add <name>` | - |

## Gotchas

- **Global components only** - Never duplicate logic across pages. Use shared components from `frontend/components/` and utilities from `frontend/lib/`. See [Cursor rule: global-components.mdc](../.cursor/rules/global-components.mdc).
- **SQLite is default** but code supports MySQL/PostgreSQL/Supabase (ADR-010)
- **Single Docker container** with Supervisor, not microservices (ADR-009)
- **Settings are user-scoped** (`user_id` column) - system settings use `SystemSetting` model
- **API routes** are all under `/api/` prefix (see `backend/routes/api.php`)
- **Frontend auth** uses `lib/auth.ts` which wraps Sanctum session cookies
- **shadcn/ui components** live in `frontend/components/ui/`; use `npx shadcn@latest add <component>` (run from `frontend/`) to add or update. Config: `frontend/components.json`.

## Versioning

Sourdough follows [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backwards compatible)
- **PATCH** - Bug fixes

Current version is stored in the `VERSION` file and accessible via `/api/version`.
