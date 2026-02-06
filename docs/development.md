# Development Configuration

Development setup, tooling, and configuration:

- [Developer Guide](dev/README.md) - Complete development setup, project structure, testing, contributing guidelines

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for frontend development)
- PHP 8.3+ and Composer (for backend development)

## Local Setup

```bash
# Clone
git clone https://github.com/jpittelkow/sourdough.git
cd sourdough

# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Docker Setup

```bash
# Copy environment file and configure port
cp .env.example .env

# Edit .env to change port (default is 8080)
# APP_PORT=8081  # Use a different port if needed

docker-compose up -d
# Access at http://localhost:8080 (or your configured port)
```

### Running Multiple Instances

If you're running multiple apps, change the port and container name in `.env`:

```env
APP_PORT=8081
CONTAINER_NAME=sourdough-project-name
```

## Settings Import (Env to Database)

To copy current environment variables into the database (e.g. after adding new schema keys or migrating from env-only):

```bash
# Import all groups defined in settings-schema
php artisan settings:import-env

# Import only mail settings
php artisan settings:import-env --group=mail
```

Imported values are stored in `system_settings`; sensitive keys are encrypted. Config is applied at next boot via ConfigServiceProvider.

## Configuration

Sourdough is configured via environment variables. See `.env.example` for all options. Many settings can also be managed in the database (see [ADR-014](adr/014-database-settings-env-fallback.md)); database values override env when present. **Settings that must stay in env** (bootstrap/security): `APP_KEY`, `APP_ENV`, `APP_DEBUG`, `DB_*`, `LOG_*`, `CACHE_STORE`. See [Env to Database Roadmap](plans/env-to-database-roadmap.md#23-settings-that-must-stay-in-env).

### Required Variables

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Encryption key (auto-generated) |
| `APP_URL` | Backend URL |
| `FRONTEND_URL` | Frontend URL |
| `SANCTUM_STATEFUL_DOMAINS` | Domain(s) for Sanctum cookie auth. Must match the domain users access the app from (e.g. `localhost:8080`, `app.example.com`). If incorrect, login will silently fail with 401 on subsequent requests. Comma-separated for multiple domains. |

### Optional Features

Enable features by setting their configuration:

```env
# Enable Google SSO
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret

# Enable Claude AI
ANTHROPIC_API_KEY=your-key

# Enable Telegram notifications
TELEGRAM_BOT_TOKEN=your-token
```

## Backend Configuration (`backend/config/`)

- `app.php` - Application configuration
- `auth.php` - Authentication settings
- `llm.php` - LLM provider configuration
- `notifications.php` - Notification channel configuration
- `backup.php` - Backup system settings
- `database.php` - Database connection settings
- `sso.php` - SSO provider configuration

## Frontend Configuration

- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.ts` - Tailwind CSS configuration
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/vitest.config.ts` - Vitest test configuration

## Environment Variables

- `.env.example` - Root environment template
- `backend/.env.example` - Backend-specific environment template

## Testing Configuration

- `playwright.config.ts` - E2E test configuration
- `backend/phpunit.xml` - PHPUnit/Pest configuration

## Security Scanning

Automated security scanning (SAST) is integrated into the CI/CD pipeline and available for local development.

### Local Security Checks

Run all security scans locally before pushing:

```bash
# Run all security checks
./scripts/security-scan.sh

# Skip Semgrep for faster iteration
./scripts/security-scan.sh --quick

# Auto-fix ESLint issues
./scripts/security-scan.sh --fix
```

### Individual Tools

**Backend (PHPStan):**
```bash
cd backend
composer phpstan
```

**Frontend (ESLint Security):**
```bash
cd frontend
npm run lint
```

**Full Codebase (Semgrep):**
```bash
# Install: pip install semgrep
semgrep scan --config=p/security-audit --config=p/php-laravel --config=p/typescript .
```

### CI Integration

Security scanning runs automatically on push/PR to master:
- PHPStan (backend static analysis)
- ESLint with security plugin (frontend)
- Semgrep (OWASP, PHP-Laravel, TypeScript rules)

See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) for the full CI configuration. The [Release workflow](../.github/workflows/release.yml) is manual-trigger only: Actions > Release > Run workflow.
