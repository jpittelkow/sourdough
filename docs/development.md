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
git clone https://github.com/yourusername/sourdough.git
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

## Configuration

Sourdough is configured via environment variables. See `.env.example` for all options.

### Required Variables

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Encryption key (auto-generated) |
| `APP_URL` | Backend URL |
| `FRONTEND_URL` | Frontend URL |

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
